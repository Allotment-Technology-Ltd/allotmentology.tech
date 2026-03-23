"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { userAiProviderKeys, users } from "@/db/schema/tables";
import {
  packApiKeyForStorage,
  shouldEncryptApiKeysAtRest,
} from "@/lib/crypto/byok-secret";
import { normalizeAnthropicCatalogModelId } from "@/lib/ai/anthropic-catalog-model-normalize";
import { resolveCatalogNativeBaseUrl } from "@/lib/ai/provider/catalog-native-bases";
import { getDefaultAiProvider } from "@/lib/ai/provider/env-config";
import { validateOpenAiCompatibleChat } from "@/lib/ai/validate-openai-compatible";
import {
  isOpenAiCompatibleCatalogMode,
  validateCatalogProviderKey,
} from "@/lib/ai/validate-native-provider";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";
import {
  fetchRestormelKeysCatalog,
  findCatalogProviderById,
  resolveOpenAiCompatibleBaseUrlForCatalogProvider,
  type ByokCatalogClientPayload,
  type CatalogProviderSummary,
} from "@/lib/restormel-keys/catalog";

const BYOK_PATH = "/settings/restormel-keys";

async function requireSessionUser() {
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) redirect("/auth/sign-in");
  return data.user;
}

async function getAppUserIdByEmail(email: string) {
  const db = getServerDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function normalizeModelForCatalogProvider(providerId: string, model: string): string {
  const m = model.trim();
  if (providerId === "anthropic") {
    return normalizeAnthropicCatalogModelId(m);
  }
  return m;
}

/**
 * Preset / custom path: empty catalogProviderId → user supplies base URL.
 * Catalog path: base URL only when `validation.requiresBaseUrl` (handled after catalog lookup).
 */
const validateSchema = z
  .object({
    providerName: z.string().trim().min(1).max(255),
    baseUrl: z.string().trim().max(4000).optional().default(""),
    model: z.string().trim().min(1).max(512),
    apiKey: z.string().trim().min(1),
    catalogProviderId: z.string().trim().optional().default(""),
  })
  .superRefine((val, ctx) => {
    if (val.catalogProviderId.trim() !== "") return;
    const u = val.baseUrl.trim();
    if (!u) {
      ctx.addIssue({
        code: "custom",
        message: "API base URL is required for this provider.",
        path: ["baseUrl"],
      });
      return;
    }
    const urlParse = z.string().url().safeParse(u);
    if (!urlParse.success) {
      ctx.addIssue({
        code: "custom",
        message: "API base URL must be a valid URL.",
        path: ["baseUrl"],
      });
    }
  });

const addSchema = validateSchema.extend({
  label: z.string().trim().max(255).optional().default(""),
  isDefault: z.boolean(),
});

function resolveOpenAiCompatibleBaseForCatalogAction(
  provider: CatalogProviderSummary,
  userBaseUrl: string,
): { ok: true; baseUrl: string } | { ok: false; message: string } {
  const requiresBase = provider.validation?.requiresBaseUrl === true;
  if (requiresBase) {
    const u = userBaseUrl.trim();
    if (!u) {
      return { ok: false, message: "API base URL is required for this provider." };
    }
    const urlParse = z.string().url().safeParse(u);
    if (!urlParse.success) {
      return { ok: false, message: "API base URL must be a valid URL." };
    }
    return { ok: true, baseUrl: normalizeBaseUrl(u) };
  }
  return resolveOpenAiCompatibleBaseUrlForCatalogProvider(provider);
}

function resolveStoredBaseUrlForCatalogProvider(
  provider: CatalogProviderSummary,
  userBaseUrl: string,
): { ok: true; baseUrl: string } | { ok: false; message: string } {
  const requiresBase = provider.validation?.requiresBaseUrl === true;

  if (isOpenAiCompatibleCatalogMode(provider)) {
    return resolveOpenAiCompatibleBaseForCatalogAction(provider, userBaseUrl);
  }

  if (requiresBase) {
    const u = userBaseUrl.trim();
    if (!u) {
      return { ok: false, message: "API base URL is required for this provider." };
    }
    const urlParse = z.string().url().safeParse(u);
    if (!urlParse.success) {
      return { ok: false, message: "API base URL must be a valid URL." };
    }
    return { ok: true, baseUrl: normalizeBaseUrl(u) };
  }

  const legacy = resolveCatalogNativeBaseUrl(provider.id);
  if (legacy) return { ok: true, baseUrl: legacy };

  const u = userBaseUrl.trim();
  if (u) {
    const urlParse = z.string().url().safeParse(u);
    if (!urlParse.success) {
      return { ok: false, message: "API base URL must be a valid URL." };
    }
    return { ok: true, baseUrl: normalizeBaseUrl(u) };
  }

  return {
    ok: false,
    message: "Cannot resolve API base URL for this native provider.",
  };
}

export type ByokActionState = {
  error?: string;
  success?: string;
};

export type ByokKeyListItem = {
  id: string;
  label: string | null;
  providerName: string;
  baseUrl: string;
  model: string;
  isDefault: boolean;
  createdAt: Date;
};

export type ByokSettingsPageData = {
  keys: ByokKeyListItem[];
  encryptsAtRest: boolean;
  envHasAi: boolean;
  catalog: ByokCatalogClientPayload | null;
  catalogError: string | null;
  /** Canonical feed used the SDK; "fallback" means local preset catalog. */
  catalogSource: "restormel" | "fallback" | null;
  /** Set when using fallback or partial degradation (still have a catalog). */
  catalogDegradedReason: string | null;
};

export async function loadByokSettingsPageData(): Promise<ByokSettingsPageData | null> {
  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) return null;

  const db = getServerDb();
  const keys = await db
    .select({
      id: userAiProviderKeys.id,
      label: userAiProviderKeys.label,
      providerName: userAiProviderKeys.providerName,
      baseUrl: userAiProviderKeys.baseUrl,
      model: userAiProviderKeys.model,
      isDefault: userAiProviderKeys.isDefault,
      createdAt: userAiProviderKeys.createdAt,
    })
    .from(userAiProviderKeys)
    .where(
      and(
        eq(userAiProviderKeys.userId, appUserId),
        isNull(userAiProviderKeys.revokedAt),
      ),
    )
    .orderBy(desc(userAiProviderKeys.isDefault), desc(userAiProviderKeys.updatedAt));

  const catalogResult = await fetchRestormelKeysCatalog();

  return {
    keys: keys as ByokKeyListItem[],
    encryptsAtRest: shouldEncryptApiKeysAtRest(),
    envHasAi: getDefaultAiProvider() !== null,
    catalog: catalogResult.ok ? catalogResult.clientPayload : null,
    catalogError: catalogResult.ok ? null : catalogResult.message,
    catalogSource: catalogResult.ok ? catalogResult.catalogSource : null,
    catalogDegradedReason: catalogResult.ok
      ? (catalogResult.degradedReason ?? null)
      : null,
  };
}

export async function validateByokKeyAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  const parsed = validateSchema.safeParse({
    providerName: formData.get("providerName"),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
    catalogProviderId: String(formData.get("catalogProviderId") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const catalogProviderId = parsed.data.catalogProviderId.trim();
  if (!catalogProviderId) {
    const model = parsed.data.model.trim();
    const result = await validateOpenAiCompatibleChat(
      normalizeBaseUrl(parsed.data.baseUrl),
      parsed.data.apiKey,
      model,
    );
    if (!result.ok) {
      return { error: result.message };
    }
    return { success: "Key works. You can save it as a new provider entry." };
  }

  const catalogResult = await fetchRestormelKeysCatalog();
  if (!catalogResult.ok) {
    return {
      error: `Catalog unavailable (${catalogResult.message}). Reload and try again.`,
    };
  }

  const provider = findCatalogProviderById(catalogResult.catalog, catalogProviderId);
  if (!provider) {
    return {
      error:
        "Unknown catalog provider. Refresh the page and pick a provider from the current list.",
    };
  }

  const model = normalizeModelForCatalogProvider(provider.id, parsed.data.model);
  const requiresBase = provider.validation?.requiresBaseUrl === true;

  if (requiresBase && !isOpenAiCompatibleCatalogMode(provider)) {
    const u = parsed.data.baseUrl.trim();
    if (!u) {
      return { error: "API base URL is required for this provider." };
    }
    if (!z.string().url().safeParse(u).success) {
      return { error: "API base URL must be a valid URL." };
    }
  }

  let openAiCompatibleBaseUrl: string | null = null;
  if (isOpenAiCompatibleCatalogMode(provider)) {
    const resolved = resolveOpenAiCompatibleBaseForCatalogAction(
      provider,
      parsed.data.baseUrl,
    );
    if (!resolved.ok) {
      return { error: resolved.message };
    }
    openAiCompatibleBaseUrl = resolved.baseUrl;
  }

  const result = await validateCatalogProviderKey(
    provider,
    parsed.data.apiKey,
    model,
    openAiCompatibleBaseUrl,
  );
  if (!result.ok) {
    return { error: result.message };
  }
  return { success: "Key works. You can save it as a new provider entry." };
}

export async function addProviderKeyAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  const parsed = addSchema.safeParse({
    label: String(formData.get("label") ?? ""),
    providerName: formData.get("providerName"),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
    catalogProviderId: String(formData.get("catalogProviderId") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const keyTrim = parsed.data.apiKey.trim();
  if (!keyTrim) {
    return { error: "API key is required." };
  }

  const db = getServerDb();
  const catalogProviderId = parsed.data.catalogProviderId.trim();

  let baseUrl: string;
  let catalogIdForRow: string | null = null;

  if (!catalogProviderId) {
    baseUrl = normalizeBaseUrl(parsed.data.baseUrl);
  } else {
    const catalogResult = await fetchRestormelKeysCatalog();
    if (!catalogResult.ok) {
      return {
        error: `Catalog unavailable (${catalogResult.message}). Reload and try again.`,
      };
    }
    const provider = findCatalogProviderById(catalogResult.catalog, catalogProviderId);
    if (!provider) {
      return {
        error:
          "Unknown catalog provider. Refresh the page and pick a provider from the current list.",
      };
    }
    catalogIdForRow = provider.id;
    const resolved = resolveStoredBaseUrlForCatalogProvider(provider, parsed.data.baseUrl);
    if (!resolved.ok) {
      return { error: resolved.message };
    }
    baseUrl = resolved.baseUrl;
  }

  const model =
    catalogIdForRow != null
      ? normalizeModelForCatalogProvider(catalogIdForRow, parsed.data.model)
      : parsed.data.model.trim();

  const stored = packApiKeyForStorage(keyTrim);

  if (parsed.data.isDefault) {
    await db
      .update(userAiProviderKeys)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(userAiProviderKeys.userId, appUserId),
          isNull(userAiProviderKeys.revokedAt),
        ),
      );
  }

  await db.insert(userAiProviderKeys).values({
    userId: appUserId,
    label: parsed.data.label || null,
    providerName: parsed.data.providerName,
    catalogProviderId: catalogIdForRow,
    baseUrl,
    model,
    apiKeyStored: stored,
    isDefault: parsed.data.isDefault,
    updatedAt: new Date(),
  });

  revalidatePath(BYOK_PATH);
  return { success: "Saved. Revoke this entry anytime if the key is exposed." };
}

export async function revokeProviderKeyFormAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string" || !z.string().uuid().safeParse(idRaw).success) {
    return { error: "Invalid key id." };
  }

  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  const [row] = await db
    .select()
    .from(userAiProviderKeys)
    .where(
      and(
        eq(userAiProviderKeys.id, idRaw),
        eq(userAiProviderKeys.userId, appUserId),
        isNull(userAiProviderKeys.revokedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return { error: "Key not found or already revoked." };
  }

  const now = new Date();
  await db
    .update(userAiProviderKeys)
    .set({ revokedAt: now, isDefault: false, updatedAt: now })
    .where(eq(userAiProviderKeys.id, idRaw));

  if (row.isDefault) {
    const [next] = await db
      .select({ id: userAiProviderKeys.id })
      .from(userAiProviderKeys)
      .where(
        and(
          eq(userAiProviderKeys.userId, appUserId),
          isNull(userAiProviderKeys.revokedAt),
        ),
      )
      .orderBy(desc(userAiProviderKeys.updatedAt))
      .limit(1);

    if (next) {
      await db
        .update(userAiProviderKeys)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(userAiProviderKeys.id, next.id));
    }
  }

  revalidatePath(BYOK_PATH);
  return { success: "Key revoked. Add a new entry when you have a replacement." };
}

export async function setDefaultProviderKeyFormAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string" || !z.string().uuid().safeParse(idRaw).success) {
    return { error: "Invalid key id." };
  }

  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  const [row] = await db
    .select({ id: userAiProviderKeys.id })
    .from(userAiProviderKeys)
    .where(
      and(
        eq(userAiProviderKeys.id, idRaw),
        eq(userAiProviderKeys.userId, appUserId),
        isNull(userAiProviderKeys.revokedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return { error: "Key not found." };
  }

  await db
    .update(userAiProviderKeys)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(
      and(
        eq(userAiProviderKeys.userId, appUserId),
        isNull(userAiProviderKeys.revokedAt),
      ),
    );

  await db
    .update(userAiProviderKeys)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(userAiProviderKeys.id, idRaw));

  revalidatePath(BYOK_PATH);
  return { success: "Default provider updated for AI drafting." };
}

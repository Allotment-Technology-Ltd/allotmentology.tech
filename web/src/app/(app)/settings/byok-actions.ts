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
import { resolveCatalogNativeBaseUrl } from "@/lib/ai/provider/catalog-native-bases";
import { getDefaultAiProvider } from "@/lib/ai/provider/env-config";
import { validateOpenAiCompatibleChat } from "@/lib/ai/validate-openai-compatible";
import { validateByokCatalogProvider } from "@/lib/ai/validate-native-provider";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";
import {
  fetchRestormelKeysCatalog,
  type ByokCatalogClientPayload,
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

const CATALOG_PROVIDER_IDS = ["openai", "anthropic", "google"] as const;
type CatalogProviderId = (typeof CATALOG_PROVIDER_IDS)[number];

function parseCatalogProviderId(raw: unknown): CatalogProviderId | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return (CATALOG_PROVIDER_IDS as readonly string[]).includes(t)
    ? (t as CatalogProviderId)
    : undefined;
}

const validateSchema = z
  .object({
    providerName: z.string().trim().min(1).max(255),
    baseUrl: z.string().trim().max(4000).optional().default(""),
    model: z.string().trim().min(1).max(512),
    apiKey: z.string().trim().min(1),
    catalogProviderId: z.string().trim().optional().default(""),
  })
  .superRefine((val, ctx) => {
    const cid = parseCatalogProviderId(val.catalogProviderId);
    if (cid) return;
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

  const cid = parseCatalogProviderId(parsed.data.catalogProviderId);
  const result = cid
    ? await validateByokCatalogProvider(cid, parsed.data.apiKey, parsed.data.model)
    : await validateOpenAiCompatibleChat(
        normalizeBaseUrl(parsed.data.baseUrl),
        parsed.data.apiKey,
        parsed.data.model,
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
  const cid = parseCatalogProviderId(parsed.data.catalogProviderId);
  const catalogBase = cid ? resolveCatalogNativeBaseUrl(cid) : null;
  if (cid && !catalogBase) {
    return { error: "Unsupported catalog provider id." };
  }
  const baseUrl = catalogBase ?? normalizeBaseUrl(parsed.data.baseUrl);
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
    catalogProviderId: cid ?? null,
    baseUrl,
    model: parsed.data.model,
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

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
import { getDefaultAiProvider } from "@/lib/ai/provider/env-config";
import { validateOpenAiCompatibleChat } from "@/lib/ai/validate-openai-compatible";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";

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

const validateSchema = z.object({
  providerName: z.string().trim().min(1).max(255),
  baseUrl: z.string().trim().url().max(4000),
  model: z.string().trim().min(1).max(512),
  apiKey: z.string().trim().min(1),
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

export async function loadByokSettingsPageData() {
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

  return {
    keys: keys as ByokKeyListItem[],
    encryptsAtRest: shouldEncryptApiKeysAtRest(),
    envHasAi: getDefaultAiProvider() !== null,
  };
}

export async function validateByokKeyAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  const parsed = validateSchema.safeParse({
    providerName: formData.get("providerName"),
    baseUrl: formData.get("baseUrl"),
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const baseUrl = normalizeBaseUrl(parsed.data.baseUrl);
  const result = await validateOpenAiCompatibleChat(
    baseUrl,
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
    baseUrl: formData.get("baseUrl"),
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
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
  const baseUrl = normalizeBaseUrl(parsed.data.baseUrl);
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

import "server-only";

import { eq } from "drizzle-orm";

import { userAiCredentials } from "@/db/schema/tables";
import { decryptByokSecret } from "@/lib/crypto/byok-secret";
import { getServerDb } from "@/lib/db/server";
import { resolveEffectiveBaseUrl } from "@/lib/ai/byok-presets";

import { createOpenAiCompatibleProvider } from "./openai-compatible";
import { createRestormelKeysProvider } from "./restormel-keys";
import type { AiProvider } from "./types";
import { getDefaultAiModel, getDefaultAiProvider } from "./env-config";

export async function resolveAiProviderForUser(
  userId: string | null,
): Promise<AiProvider | null> {
  if (!userId) {
    return getDefaultAiProvider();
  }

  const db = getServerDb();
  const [row] = await db
    .select()
    .from(userAiCredentials)
    .where(eq(userAiCredentials.userId, userId))
    .limit(1);

  if (!row) {
    return getDefaultAiProvider();
  }

  let apiKey: string;
  try {
    apiKey = decryptByokSecret(row.encryptedApiKey);
  } catch {
    return getDefaultAiProvider();
  }

  let baseUrl: string;
  try {
    baseUrl = resolveEffectiveBaseUrl(
      row.providerPreset,
      row.customBaseUrl,
    );
  } catch {
    return getDefaultAiProvider();
  }

  if (row.providerPreset === "restormel_keys") {
    return createRestormelKeysProvider({ apiKey, baseUrl });
  }

  return createOpenAiCompatibleProvider({ apiKey, baseUrl });
}

export async function resolveAiModelForUser(
  userId: string | null,
): Promise<string> {
  if (!userId) {
    return getDefaultAiModel();
  }

  const db = getServerDb();
  const [row] = await db
    .select({ model: userAiCredentials.model })
    .from(userAiCredentials)
    .where(eq(userAiCredentials.userId, userId))
    .limit(1);

  if (!row?.model?.trim()) {
    return getDefaultAiModel();
  }

  return row.model.trim();
}

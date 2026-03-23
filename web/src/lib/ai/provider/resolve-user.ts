import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { userAiProviderKeys } from "@/db/schema/tables";
import { readApiKeyFromStorage } from "@/lib/crypto/byok-secret";
import { normalizeAnthropicCatalogModelId } from "@/lib/ai/anthropic-catalog-model-normalize";
import { getServerDb } from "@/lib/db/server";

import { createAnthropicNativeProvider } from "./anthropic-native";
import { createGoogleGeminiNativeProvider } from "./google-gemini-native";
import { createOpenAiCompatibleProvider } from "./openai-compatible";
import type { AiProvider } from "./types";
import { getDefaultAiModel, getDefaultAiProvider } from "./env-config";

export async function resolveAiProviderForUser(
  userId: string | null,
): Promise<AiProvider | null> {
  if (!userId) {
    return getDefaultAiProvider();
  }

  const db = getServerDb();
  const rows = await db
    .select()
    .from(userAiProviderKeys)
    .where(
      and(
        eq(userAiProviderKeys.userId, userId),
        isNull(userAiProviderKeys.revokedAt),
      ),
    )
    .orderBy(
      desc(userAiProviderKeys.isDefault),
      desc(userAiProviderKeys.updatedAt),
    );

  const row = rows[0];
  if (!row) {
    return getDefaultAiProvider();
  }

  const apiKey = readApiKeyFromStorage(row.apiKeyStored);
  if (!apiKey) {
    return getDefaultAiProvider();
  }

  const cid = row.catalogProviderId?.trim();
  if (cid === "anthropic") {
    return createAnthropicNativeProvider({ apiKey });
  }
  if (cid === "google") {
    return createGoogleGeminiNativeProvider({ apiKey });
  }

  const baseUrl = row.baseUrl.replace(/\/+$/, "");
  return createOpenAiCompatibleProvider({ apiKey, baseUrl });
}

export async function resolveAiModelForUser(
  userId: string | null,
): Promise<string> {
  if (!userId) {
    return getDefaultAiModel();
  }

  const db = getServerDb();
  const rows = await db
    .select({
      model: userAiProviderKeys.model,
      catalogProviderId: userAiProviderKeys.catalogProviderId,
    })
    .from(userAiProviderKeys)
    .where(
      and(
        eq(userAiProviderKeys.userId, userId),
        isNull(userAiProviderKeys.revokedAt),
      ),
    )
    .orderBy(
      desc(userAiProviderKeys.isDefault),
      desc(userAiProviderKeys.updatedAt),
    );

  const row = rows[0];
  const model = row?.model?.trim();
  if (!model) {
    return getDefaultAiModel();
  }

  if (row.catalogProviderId?.trim() === "anthropic") {
    return normalizeAnthropicCatalogModelId(model);
  }

  return model;
}

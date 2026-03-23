import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { userAiProviderKeys } from "@/db/schema/tables";
import { readApiKeyFromStorage } from "@/lib/crypto/byok-secret";
import { getServerDb } from "@/lib/db/server";

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
    .select({ model: userAiProviderKeys.model })
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

  const model = rows[0]?.model?.trim();
  if (!model) {
    return getDefaultAiModel();
  }

  return model;
}

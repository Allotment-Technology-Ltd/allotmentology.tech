import "server-only";

import { AiNotConfiguredError } from "@/lib/ai/errors";

import { createOpenAiCompatibleProvider } from "./openai-compatible";
import { createRestormelKeysProvider } from "./restormel-keys";
import type { AiProvider } from "./types";

export type { AiProvider, AiCompletionResult, AiCompletionUsage } from "./types";
export { createOpenAiCompatibleProvider, chatMessages } from "./openai-compatible";
export { createRestormelKeysProvider } from "./restormel-keys";

function readApiKey(): string | undefined {
  return process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
}

function readRestormelApiKey(): string | undefined {
  return process.env.RESTORMEL_KEYS_API_KEY?.trim();
}

function readBaseUrl(): string {
  const u =
    process.env.AI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1";
  return u.replace(/\/+$/, "");
}

function readRestormelBaseUrl(): string {
  const u =
    process.env.RESTORMEL_KEYS_BASE_URL?.trim() ||
    "https://api.restormel.dev/v1";
  return u.replace(/\/+$/, "");
}

function readProviderKind(): "openai-compatible" | "restormel-keys" {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "restormel-keys" || raw === "restormel") {
    return "restormel-keys";
  }
  return "openai-compatible";
}

/** Returns null when no API key is present (build/dev without AI). */
export function getDefaultAiProvider(): AiProvider | null {
  const kind = readProviderKind();
  if (kind === "restormel-keys") {
    const apiKey = readRestormelApiKey();
    if (!apiKey) return null;
    return createRestormelKeysProvider({
      apiKey,
      baseUrl: readRestormelBaseUrl(),
    });
  }

  const apiKey = readApiKey();
  if (!apiKey) return null;
  return createOpenAiCompatibleProvider({
    apiKey,
    baseUrl: readBaseUrl(),
  });
}

export function requireDefaultAiProvider(): AiProvider {
  const p = getDefaultAiProvider();
  if (!p) throw new AiNotConfiguredError();
  return p;
}

export function getDefaultAiModel(): string {
  const kind = readProviderKind();
  if (kind === "restormel-keys") {
    return process.env.RESTORMEL_KEYS_MODEL?.trim() || "restormel-writer-v1";
  }
  return process.env.AI_MODEL?.trim() || "gpt-4o-mini";
}

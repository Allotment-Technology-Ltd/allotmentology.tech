import "server-only";

import { AiNotConfiguredError } from "@/lib/ai/errors";

import { createOpenAiCompatibleProvider } from "./openai-compatible";
import type { AiProvider } from "./types";

export type { AiProvider, AiCompletionResult, AiCompletionUsage } from "./types";
export { createOpenAiCompatibleProvider, chatMessages } from "./openai-compatible";

function readApiKey(): string | undefined {
  return process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
}

function readBaseUrl(): string {
  const u =
    process.env.AI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1";
  return u.replace(/\/+$/, "");
}

/** Returns null when no API key is present (build/dev without AI). */
export function getDefaultAiProvider(): AiProvider | null {
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
  return process.env.AI_MODEL?.trim() || "gpt-4o-mini";
}

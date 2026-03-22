import "server-only";

import type { ChatMessage } from "@/lib/ai/types";
import { AiProviderError } from "@/lib/ai/errors";

import type { AiCompletionResult, AiProvider } from "./types";

type CompleteParams = Parameters<AiProvider["complete"]>[0];

export type OpenAiCompatibleConfig = {
  apiKey: string;
  /** Base URL including /v1, e.g. https://api.openai.com/v1 */
  baseUrl: string;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * OpenAI-compatible chat completions (POST /chat/completions).
 * Works with OpenAI and many gateways that mirror the same JSON shape.
 */
export function createOpenAiCompatibleProvider(
  config: OpenAiCompatibleConfig,
): AiProvider {
  const base = normalizeBaseUrl(config.baseUrl);

  return {
    id: "openai-compatible",

    async complete(params: CompleteParams): Promise<AiCompletionResult> {
      const url = `${base}/chat/completions`;
      const body: Record<string, unknown> = {
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.2,
      };
      if (params.maxTokens != null) {
        body.max_tokens = params.maxTokens;
      }
      if (params.jsonObject) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const raw = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const errMsg =
          typeof raw.error === "object" &&
          raw.error &&
          "message" in raw.error &&
          typeof (raw.error as { message?: unknown }).message === "string"
            ? String((raw.error as { message: string }).message)
            : res.statusText;
        throw new AiProviderError(
          `AI provider error (${res.status}): ${errMsg}`,
          res.status,
        );
      }

      const choice = (raw.choices as { message?: { content?: string } }[] | undefined)?.[0];
      const text = choice?.message?.content ?? "";
      const usageRaw = raw.usage as
        | {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          }
        | undefined;

      return {
        text,
        raw,
        usage: usageRaw
          ? {
              promptTokens: usageRaw.prompt_tokens,
              completionTokens: usageRaw.completion_tokens,
              totalTokens: usageRaw.total_tokens,
            }
          : undefined,
      };
    },
  };
}

export function chatMessages(
  system: string,
  user: string,
): ChatMessage[] {
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

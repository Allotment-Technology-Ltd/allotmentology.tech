import "server-only";

import type { ChatMessage } from "@/lib/ai/types";
import { AiProviderError } from "@/lib/ai/errors";

import type { AiCompletionResult, AiProvider } from "./types";

type CompleteParams = Parameters<AiProvider["complete"]>[0];

export type AnthropicNativeConfig = {
  apiKey: string;
};

function splitSystemAndMessages(messages: ChatMessage[]): {
  system: string | undefined;
  rest: { role: "user" | "assistant"; content: string }[];
} {
  const systemParts: string[] = [];
  const rest: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else if (m.role === "user" || m.role === "assistant") {
      rest.push({ role: m.role, content: m.content });
    }
  }
  const system = systemParts.length > 0 ? systemParts.join("\n\n") : undefined;
  return { system, rest };
}

/**
 * Native Anthropic Messages API (not OpenAI-compatible).
 */
export function createAnthropicNativeProvider(config: AnthropicNativeConfig): AiProvider {
  return {
    id: "anthropic-native",

    async complete(params: CompleteParams): Promise<AiCompletionResult> {
      const { system: sys0, rest: messages } = splitSystemAndMessages(params.messages);
      let system = sys0;

      if (params.jsonObject) {
        const hint =
          "\n\nRespond with a single valid JSON object only. No markdown fences or commentary.";
        system = system ? `${system}${hint}` : hint.trim();
      }

      const body: Record<string, unknown> = {
        model: params.model,
        max_tokens: params.maxTokens ?? 4096,
        messages,
      };
      if (system) {
        body.system = system;
      }
      if (params.temperature != null) {
        body.temperature = params.temperature;
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
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
          `Anthropic error (${res.status}): ${errMsg}`,
          res.status,
        );
      }

      const content = raw.content as { type?: string; text?: string }[] | undefined;
      const text =
        content
          ?.filter((b) => b.type === "text" && typeof b.text === "string")
          .map((b) => b.text)
          .join("") ?? "";

      const usageRaw = raw.usage as
        | { input_tokens?: number; output_tokens?: number }
        | undefined;

      return {
        text,
        raw,
        usage: usageRaw
          ? {
              promptTokens: usageRaw.input_tokens,
              completionTokens: usageRaw.output_tokens,
              totalTokens:
                (usageRaw.input_tokens ?? 0) + (usageRaw.output_tokens ?? 0),
            }
          : undefined,
      };
    },
  };
}

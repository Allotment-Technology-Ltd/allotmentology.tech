import "server-only";

import type { ChatMessage } from "@/lib/ai/types";
import { AiProviderError } from "@/lib/ai/errors";
import { logAiProviderHttpFailure } from "@/lib/ai/log-provider-failure";

import type { AiCompletionResult, AiProvider } from "./types";

type CompleteParams = Parameters<AiProvider["complete"]>[0];

export type GoogleGeminiNativeConfig = {
  apiKey: string;
};

function toGeminiContents(messages: ChatMessage[]): {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
} {
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n")
    .trim();

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: m.content }] });
  }

  return {
    systemInstruction:
      systemParts.length > 0
        ? { parts: [{ text: systemParts }] }
        : undefined,
    contents,
  };
}

/**
 * Native Google Gemini generateContent (API key), not OpenAI-compatible.
 */
export function createGoogleGeminiNativeProvider(
  config: GoogleGeminiNativeConfig,
): AiProvider {
  return {
    id: "google-gemini-native",

    async complete(params: CompleteParams): Promise<AiCompletionResult> {
      const url = new URL(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent`,
      );
      url.searchParams.set("key", config.apiKey.trim());

      const { systemInstruction, contents } = toGeminiContents(params.messages);
      if (contents.length === 0) {
        throw new AiProviderError("Gemini requires at least one user/assistant message.", 400, {
          providerId: "google-gemini-native",
          modelId: params.model,
        });
      }

      const generationConfig: Record<string, unknown> = {};
      if (params.temperature != null) {
        generationConfig.temperature = params.temperature;
      }
      if (params.maxTokens != null) {
        generationConfig.maxOutputTokens = params.maxTokens;
      }
      if (params.jsonObject) {
        generationConfig.responseMimeType = "application/json";
      }

      const body: Record<string, unknown> = {
        contents,
      };
      if (systemInstruction) {
        body.systemInstruction = systemInstruction;
      }
      if (Object.keys(generationConfig).length > 0) {
        body.generationConfig = generationConfig;
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        logAiProviderHttpFailure({
          providerId: "google-gemini-native",
          status: res.status,
          modelId: params.model,
          endpointHost: "generativelanguage.googleapis.com",
        });
        throw new AiProviderError(`Gemini error (${res.status}): ${errMsg}`, res.status, {
          providerId: "google-gemini-native",
          modelId: params.model,
        });
      }

      const candidates = raw.candidates as
        | { content?: { parts?: { text?: string }[] } }[]
        | undefined;
      const text =
        candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("") ?? "";

      const usageMeta = raw.usageMetadata as
        | {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
          }
        | undefined;

      return {
        text,
        raw,
        usage: usageMeta
          ? {
              promptTokens: usageMeta.promptTokenCount,
              completionTokens: usageMeta.candidatesTokenCount,
              totalTokens: usageMeta.totalTokenCount,
            }
          : undefined,
      };
    },
  };
}

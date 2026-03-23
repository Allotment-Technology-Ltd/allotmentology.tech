import "server-only";

import type { AiCompletionResult, AiProvider } from "./types";
import { createOpenAiCompatibleProvider } from "./openai-compatible";

export type RestormelKeysConfig = {
  apiKey: string;
  baseUrl: string;
};

/**
 * Restormel Keys adapter.
 * It currently speaks the OpenAI-compatible chat completions shape.
 */
export function createRestormelKeysProvider(
  config: RestormelKeysConfig,
): AiProvider {
  const base = createOpenAiCompatibleProvider({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  return {
    id: "restormel-keys",
    async complete(params): Promise<AiCompletionResult> {
      return base.complete(params);
    },
  };
}

import type { ChatMessage } from "@/lib/ai/types";

export type AiCompletionUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AiCompletionResult = {
  text: string;
  raw?: unknown;
  usage?: AiCompletionUsage;
};

export interface AiProvider {
  readonly id: string;

  complete(params: {
    messages: ChatMessage[];
    model: string;
    temperature?: number;
    maxTokens?: number;
    /** Request JSON object mode when the upstream API supports it. */
    jsonObject?: boolean;
  }): Promise<AiCompletionResult>;
}

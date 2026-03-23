import "server-only";

import type { ZodType } from "zod";

import { buildLayeredSystemPrompt } from "@/lib/ai/constitution";
import { AiParseError } from "@/lib/ai/errors";
import { parseModelJson } from "@/lib/ai/json-parse";
import { chatMessages } from "@/lib/ai/provider/openai-compatible";
import type { AiProvider } from "@/lib/ai/provider/types";
import type { AiModuleKind } from "@/lib/ai/types";

import { insertAiGenerationLog } from "./logging";

export type JsonRunContext = {
  provider: AiProvider;
  model: string;
  userId?: string | null;
  opportunityId?: string | null;
};

/**
 * Single path for JSON-shaped model outputs: layered system prompt, completion, Zod parse, audit log.
 */
export async function runJsonModule<T>(ctx: JsonRunContext, opts: {
  moduleKind: AiModuleKind;
  moduleName: string;
  moduleDirective: string;
  userPayload: string;
  schema: ZodType<T>;
  inputSnapshot: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  /** Override default constitution layering (e.g. Mitchell persona). */
  buildSystemPrompt?: (moduleDirective: string) => string;
}): Promise<{ value: T; logId: string }> {
  const build =
    opts.buildSystemPrompt ?? buildLayeredSystemPrompt;
  const system = build(opts.moduleDirective);
  const messages = chatMessages(system, opts.userPayload);

  const result = await ctx.provider.complete({
    messages,
    model: ctx.model,
    temperature: opts.temperature ?? 0.15,
    maxTokens: opts.maxTokens ?? 4096,
    jsonObject: true,
  });

  let parsedJson: unknown;
  try {
    parsedJson = parseModelJson(result.text);
  } catch {
    throw new AiParseError(
      "Model returned non-JSON output.",
      result.text.slice(0, 2000),
    );
  }

  const parsed = opts.schema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new AiParseError(
      parsed.error.issues[0]?.message ?? "Output failed schema validation.",
      result.text.slice(0, 2000),
    );
  }

  const value = parsed.data;
  const outputJson =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : { value };

  const logId = await insertAiGenerationLog({
    userId: ctx.userId,
    opportunityId: ctx.opportunityId,
    moduleKind: opts.moduleKind,
    moduleName: opts.moduleName,
    providerModel: ctx.model,
    inputJson: opts.inputSnapshot,
    outputJson,
    usage: result.usage,
  });

  return { value, logId };
}

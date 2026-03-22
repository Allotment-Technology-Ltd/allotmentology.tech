import "server-only";

import { aiGenerationLogs } from "@/db/schema/tables";
import { getServerDb } from "@/lib/db/server";

import type { AiModuleKind } from "@/lib/ai/types";
import type { AiCompletionUsage } from "@/lib/ai/provider/types";

export async function insertAiGenerationLog(input: {
  userId?: string | null;
  opportunityId?: string | null;
  moduleKind: AiModuleKind;
  moduleName: string;
  providerModel: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  usage?: AiCompletionUsage;
}): Promise<string> {
  const db = getServerDb();
  const usageJson =
    input.usage == null
      ? null
      : {
          promptTokens: input.usage.promptTokens,
          completionTokens: input.usage.completionTokens,
          totalTokens: input.usage.totalTokens,
        };

  const [row] = await db
    .insert(aiGenerationLogs)
    .values({
      userId: input.userId ?? null,
      opportunityId: input.opportunityId ?? null,
      moduleKind: input.moduleKind,
      moduleName: input.moduleName,
      providerModel: input.providerModel,
      inputJson: input.inputJson,
      outputJson: input.outputJson,
      usageJson,
    })
    .returning({ id: aiGenerationLogs.id });

  if (!row) {
    throw new Error("Failed to persist AI generation log.");
  }
  return row.id;
}

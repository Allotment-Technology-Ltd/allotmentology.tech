import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const detectScopeConflictOutputSchema = z.object({
  conflicts: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  safeToMerge: z.boolean(),
  notes: z.string(),
});

export type DetectScopeConflictOutput = z.infer<
  typeof detectScopeConflictOutputSchema
>;

export async function detectScopeConflict(
  ctx: FundingOpsAiContext,
  input: { scopeA: string; scopeB: string; labels?: [string, string] },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "detect-scope-conflict",
    moduleDirective: `Detect contradictions in scope, deliverables, timelines, or commitments between two texts.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: detectScopeConflictOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

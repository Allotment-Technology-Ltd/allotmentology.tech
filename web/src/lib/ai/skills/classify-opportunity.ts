import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const classifyOpportunityOutputSchema = z.object({
  primaryType: z.enum([
    "grant",
    "competition",
    "tax_credit",
    "loan",
    "procurement",
    "other",
    "unknown",
  ]),
  secondaryTags: z.array(z.string()),
  reason: z.string(),
});

export type ClassifyOpportunityOutput = z.infer<
  typeof classifyOpportunityOutputSchema
>;

export async function classifyOpportunity(
  ctx: FundingOpsAiContext,
  input: { title: string; summary?: string; funderName?: string },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "classify-opportunity",
    moduleDirective: `Classify the opportunity type from short text only.
If unclear, use unknown and explain in reason.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: classifyOpportunityOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

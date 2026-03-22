import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

const dim = z.number().int().min(1).max(5).nullable();

export const scoreOpportunityFitOutputSchema = z.object({
  eligibilityFit: dim,
  restormelFit: dim,
  sophiaFit: dim,
  cashValue: dim,
  burnReductionValue: dim,
  effortRequired: dim,
  strategicValue: dim,
  timeSensitivity: dim,
  notes: z.string(),
  /** Explicit: model suggestion only; human scoring row is authoritative. */
  disclaimer: z.string(),
});

export type ScoreOpportunityFitOutput = z.infer<
  typeof scoreOpportunityFitOutputSchema
>;

export async function scoreOpportunityFit(
  ctx: FundingOpsAiContext,
  input: {
    title: string;
    summary?: string;
    eligibilityNotes?: string;
    internalNotes?: string;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "score-opportunity-fit",
    moduleDirective: `Propose 1–5 scores aligned with the app's eight dimensions (nullable if no basis).
Effort: 1 = light, 5 = heavy. This is a draft suggestion only — the workspace scoring UI remains authoritative.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: scoreOpportunityFitOutputSchema,
    inputSnapshot: { ...input },
    maxTokens: 2048,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

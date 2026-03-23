import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const opportunityFullScoringOutputSchema = z.object({
  eligibilityFit: z.number().int().min(1).max(5),
  restormelFit: z.number().int().min(1).max(5),
  sophiaFit: z.number().int().min(1).max(5),
  cashValue: z.number().int().min(1).max(5),
  burnReductionValue: z.number().int().min(1).max(5),
  effortRequired: z.number().int().min(1).max(5),
  strategicValue: z.number().int().min(1).max(5),
  /** Deadline pressure / urgency */
  timeSensitivity: z.number().int().min(1).max(5),
  rationale: z.string().min(1),
});

export type OpportunityFullScoringOutput = z.infer<
  typeof opportunityFullScoringOutputSchema
>;

export async function runOpportunityFullScoring(
  ctx: FundingOpsAiContext,
  input: {
    opportunity: {
      title: string;
      funderName?: string | null;
      summary?: string | null;
      eligibilityNotes?: string | null;
      internalNotes?: string | null;
      grantUrl?: string | null;
      productFitAssessmentMd?: string | null;
    };
    knowledgeLinks: { title: string; summary?: string | null; url: string }[];
    approvedCollateral: { title: string; excerpt: string }[];
    grantPageExcerpt?: string | null;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "opportunity-full-scoring",
    moduleDirective: `Score this funding opportunity for internal triage (1–5 each dimension).
Definitions:
- eligibilityFit: match to stated eligibility and constraints.
- restormelFit: community / keys / access narrative alignment.
- sophiaFit: product evidence and operator-grade story.
- cashValue: relative value of the award (not exact £).
- burnReductionValue: runway pressure relief if won.
- effortRequired: 1 = light lift, 5 = heavy lift.
- strategicValue: importance beyond cash.
- timeSensitivity: deadline pressure and decision timing (maps to "urgency").
Be conservative; justify in rationale. Output integers 1–5 only.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: opportunityFullScoringOutputSchema,
    inputSnapshot: {
      title: input.opportunity.title,
      knowledgeCount: input.knowledgeLinks.length,
      collateralCount: input.approvedCollateral.length,
      hasGrantExcerpt: Boolean(input.grantPageExcerpt?.trim()),
    },
    temperature: 0.15,
    maxTokens: 4096,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

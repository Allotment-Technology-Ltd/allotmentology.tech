import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const eligibilityAssessorOutputSchema = z.object({
  eligibleLikelihood: z.enum(["high", "medium", "low", "unknown"]),
  rationale: z.string(),
  blockers: z.array(z.string()),
  citationsNeeded: z.array(z.string()),
  questionsForFounder: z.array(z.string()),
});

export type EligibilityAssessorOutput = z.infer<
  typeof eligibilityAssessorOutputSchema
>;

export async function runEligibilityAssessor(
  ctx: FundingOpsAiContext,
  input: {
    eligibilityNotes: string;
    summary?: string;
    funderName?: string;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "subagent",
    moduleName: "eligibility-assessor",
    moduleDirective: `You assess eligibility fit from notes provided by the team.
Do not invent programme rules. Flag what must be verified against the official call.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: eligibilityAssessorOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

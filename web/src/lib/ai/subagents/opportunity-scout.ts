import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const opportunityScoutOutputSchema = z.object({
  headlineSummary: z.string(),
  funderHypothesis: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
  caveats: z.array(z.string()),
});

export type OpportunityScoutOutput = z.infer<typeof opportunityScoutOutputSchema>;

export async function runOpportunityScout(
  ctx: FundingOpsAiContext,
  input: { rawDescription: string; sourceLabel?: string },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "subagent",
    moduleName: "opportunity-scout",
    moduleDirective: `You distill raw opportunity text into a concise operator briefing.
Infer plausible funder/mechanism hypotheses only as hypotheses, never as facts.
If the text is thin, expand followUpQuestions and caveats; keep confidence low.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: opportunityScoutOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

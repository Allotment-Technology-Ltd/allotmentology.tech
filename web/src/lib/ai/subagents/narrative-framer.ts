import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const narrativeFramerOutputSchema = z.object({
  angles: z.array(
    z.object({
      title: z.string(),
      rationale: z.string(),
      targetFunderVoice: z.string(),
    }),
  ),
  risksOfAngle: z.array(z.string()),
  avoid: z.array(z.string()),
});

export type NarrativeFramerOutput = z.infer<typeof narrativeFramerOutputSchema>;

export async function runNarrativeFramer(
  ctx: FundingOpsAiContext,
  input: {
    opportunityTitle: string;
    summary?: string;
    productPillars?: string[];
    constraints?: string[];
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "subagent",
    moduleName: "narrative-framer",
    moduleDirective: `You propose 2–4 distinct narrative angles for this bid.
Each angle must be actionable and honest about tradeoffs. Flag risks of overclaiming.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: narrativeFramerOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

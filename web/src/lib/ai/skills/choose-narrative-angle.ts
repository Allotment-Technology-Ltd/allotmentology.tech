import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const chooseNarrativeAngleOutputSchema = z.object({
  primaryAngle: z.string(),
  alternates: z.array(z.string()),
  evidenceToGather: z.array(z.string()),
});

export type ChooseNarrativeAngleOutput = z.infer<
  typeof chooseNarrativeAngleOutputSchema
>;

export async function chooseNarrativeAngle(
  ctx: FundingOpsAiContext,
  input: {
    opportunityTitle: string;
    audience?: string;
    productSummary?: string;
    constraints?: string[];
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "choose-narrative-angle",
    moduleDirective: `Pick one primary narrative angle and short alternates.
Stay practical; list evidence the founder still needs.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: chooseNarrativeAngleOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

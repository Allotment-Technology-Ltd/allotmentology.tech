import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const extractEvidenceOutputSchema = z.object({
  bullets: z.array(z.string()),
  gaps: z.array(z.string()),
  suggestedArtifacts: z.array(z.string()),
});

export type ExtractEvidenceOutput = z.infer<typeof extractEvidenceOutputSchema>;

export async function extractEvidence(
  ctx: FundingOpsAiContext,
  input: { narrative: string; claimTypes?: string[] },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "extract-evidence",
    moduleDirective: `Extract evidence-ready bullets from narrative. Mark gaps where proof is missing or weak.
Do not invent studies, metrics, or customers.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: extractEvidenceOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

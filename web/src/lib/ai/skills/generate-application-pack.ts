import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const generateApplicationPackOutputSchema = z.object({
  packFragments: z.record(z.string(), z.string()),
  missingInputs: z.array(z.string()),
  risks: z.array(z.string()),
});

export type GenerateApplicationPackOutput = z.infer<
  typeof generateApplicationPackOutputSchema
>;

export async function generateApplicationPack(
  ctx: FundingOpsAiContext,
  input: {
    opportunityTitle: string;
    eligibilityNotes?: string;
    collateralSnippets?: Record<string, string>;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "generate-application-pack",
    moduleDirective: `Produce packFragments keyed by logical section (working_thesis, summary_100, etc.) as plain strings.
Use only provided snippets as facts; mark gaps in missingInputs. Draft-only — no submission.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: generateApplicationPackOutputSchema,
    inputSnapshot: { ...input },
    maxTokens: 8192,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const extractGrantDetailsOutputSchema = z.object({
  summary: z.string().optional(),
  eligibilityNotes: z.string().optional(),
  /** ISO 8601 datetime in UTC or with offset, or null if unknown */
  closesAtIso: z.string().nullable().optional(),
  /** Decimal string without currency symbol, e.g. "150000" */
  estimatedValue: z.string().nullable().optional(),
  currencyCode: z.string().length(3).optional().nullable(),
  funderName: z.string().optional(),
  /** Markdown: weighted product recommendations vs approved collateral titles */
  productFitAssessmentMd: z.string().optional(),
});

export type ExtractGrantDetailsOutput = z.infer<
  typeof extractGrantDetailsOutputSchema
>;

export async function extractGrantDetails(
  ctx: FundingOpsAiContext,
  input: {
    pageText: string;
    pageUrl: string;
    existingTitle: string;
    approvedCollateral: { title: string; excerpt: string }[];
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "extract-grant-details",
    moduleDirective: `You extract structured funding-call facts from raw page text.
Infer deadlines, amounts, eligibility, and timelines only when reasonably supported by the text.
If uncertain, omit fields or use null rather than guessing.
For productFitAssessmentMd: compare the call to the provided approved collateral/product snippets.
Assign explicit weights (e.g. High / Medium / Low) and order products by fit for this specific call.
Use concise markdown with bullet lists.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: extractGrantDetailsOutputSchema,
    inputSnapshot: {
      pageUrl: input.pageUrl,
      existingTitle: input.existingTitle,
      collateralCount: input.approvedCollateral.length,
    },
    temperature: 0.1,
    maxTokens: 4096,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

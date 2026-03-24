import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const fundingSearchQueryExpansionOutputSchema = z.object({
  queries: z
    .array(z.string().trim().min(3).max(220))
    .min(3)
    .max(5),
});

export type FundingSearchQueryExpansionOutput = z.infer<
  typeof fundingSearchQueryExpansionOutputSchema
>;

/**
 * Turn a free-text funding brief into 3–5 web search queries (grants, credits, programmes).
 */
export async function runFundingSearchQueryExpansion(
  ctx: FundingOpsAiContext,
  input: { userBrief: string },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "funding-search-query-expansion",
    moduleDirective: `You produce distinct web search queries to find real funding programmes.
Cover: cash grants, tax credits, innovation funds, startup schemes, and **in-kind / credit** programmes
(cloud credits: AWS Activate, Google Cloud credits, Azure; AI API credits: Anthropic, OpenAI startup programmes where public).
Mix geography if the user mentions a country/region. Use English unless the user asks otherwise.
Do not include site: operators or boolean hacks unless essential. Each query should be different in intent.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: fundingSearchQueryExpansionOutputSchema,
    inputSnapshot: { ...input },
    temperature: 0.2,
    maxTokens: 800,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

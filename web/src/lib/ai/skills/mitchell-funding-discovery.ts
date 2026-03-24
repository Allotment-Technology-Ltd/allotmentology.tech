import { z } from "zod";

import { normalizeResultUrl } from "@/lib/funding-search/tavily";
import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const fundingDiscoveryLeadSchema = z.object({
  title: z.string().min(1).max(4000),
  funderName: z.string().max(255).nullable().optional().default(null),
  summary: z.string().max(8000),
  /** Must be one of the URLs from the search results payload (exact match after normalisation is not required; pick the best canonical programme page). */
  grantUrl: z.string().url(),
  closesAtIso: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("ISO-8601 date if mentioned in snippets; else null"),
  tags: z
    .array(z.string().max(64))
    .max(12)
    .optional()
    .default([])
    .describe("e.g. cloud_credits, marketing, UK, R&D"),
  eligibilityNotes: z
    .string()
    .max(4000)
    .optional()
    .default("")
    .describe("Short notes on who it is for; unknowns explicit"),
  confidence: z.enum(["low", "medium", "high"]).optional().default("low"),
  caveats: z.array(z.string().max(500)).max(8).optional().default([]),
});

export const mitchellFundingDiscoveryOutputSchema = z.object({
  leads: z.array(fundingDiscoveryLeadSchema).max(10),
  overallCaveats: z.array(z.string().max(500)).max(8).optional().default([]),
});

export type FundingDiscoveryLead = z.infer<typeof fundingDiscoveryLeadSchema>;
export type MitchellFundingDiscoveryOutput = z.infer<
  typeof mitchellFundingDiscoveryOutputSchema
>;

export type TavilyResultInput = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

/**
 * Structure noisy web search hits into opportunity-shaped leads. Mitchell must not invent URLs:
 * every grantUrl must correspond to a provided search result URL.
 */
export async function runMitchellFundingDiscovery(
  ctx: FundingOpsAiContext,
  input: {
    userBrief: string;
    searchResults: TavilyResultInput[];
  },
) {
  const allowedUrls = new Set(
    input.searchResults.map((r) => normalizeResultUrl(r.url)),
  );
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "mitchell-funding-discovery",
    moduleDirective: `You turn web search snippets (and sometimes longer **fetched page excerpts** after "--- Fetched page text ---") into a structured list of funding opportunities for an operator.
Rules:
- **Never fabricate URLs.** Each lead's grantUrl MUST be copied exactly from the "searchResults[].url" list in the payload (choose the best official page per programme).
- If snippets conflict, lower confidence and add caveats.
- Prefer programmes that are still likely open or recurring; if dates are stale, say so in caveats.
- Tags: short snake_case or plain words (marketing, aws_credits, anthropic, google_cloud, etc.).
- Summaries: 2–4 sentences, factual hedging where the source text is thin; use fetched excerpts when they add deadlines or eligibility detail.`,
    userPayload: JSON.stringify(
      {
        userBrief: input.userBrief,
        allowedUrls: [...allowedUrls].sort(),
        searchResults: input.searchResults.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content.slice(0, 8000),
          score: r.score,
        })),
      },
      null,
      2,
    ),
    schema: mitchellFundingDiscoveryOutputSchema,
    inputSnapshot: {
      userBrief: input.userBrief,
      resultCount: input.searchResults.length,
    },
    temperature: 0.15,
    maxTokens: 6144,
  });

  const validated = value.leads.filter((lead) => {
    try {
      return allowedUrls.has(normalizeResultUrl(lead.grantUrl));
    } catch {
      return false;
    }
  });

  return asGenerated(
    {
      ...value,
      leads: validated,
    },
    { model: ctx.model, logId },
  );
}

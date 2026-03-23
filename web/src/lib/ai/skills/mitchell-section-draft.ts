import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import { buildMitchellSystemPrompt } from "@/lib/ai/mitchell";
import {
  formatMitchellMaterialKindLabel,
  mitchellMaterialRequestSchema,
} from "@/lib/ai/mitchell-materials";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const mitchellSectionDraftOutputSchema = z.object({
  /** First-draft Markdown for the requested section; use [PLACEHOLDERS] for unknown facts */
  draftMarkdown: z.string().min(1),
  /** Specific gaps: what each placeholder needs */
  blanksToFill: z
    .array(
      z.object({
        placeholder: z.string(),
        needFromUser: z.string(),
      }),
    )
    .default([]),
  /** Structured asks: LinkedIn, CV, past applications, etc. */
  materialRequests: z.array(mitchellMaterialRequestSchema).default([]),
  /** Free-form lines if something does not fit the categories */
  otherAsks: z.array(z.string()).default([]),
  citationsNeeded: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type MitchellSectionDraftOutput = z.infer<
  typeof mitchellSectionDraftOutputSchema
>;

export function formatMitchellSectionFollowupMd(
  o: MitchellSectionDraftOutput,
): string {
  const parts: string[] = [];
  if (o.blanksToFill.length > 0) {
    parts.push(
      "### Fill in the blanks\n\n" +
        o.blanksToFill
          .map(
            (b) =>
              `- **${b.placeholder}** — ${b.needFromUser}`,
          )
          .join("\n"),
    );
  }
  if (o.materialRequests.length > 0) {
    parts.push(
      "\n\n### Materials that would unlock a stronger draft\n\n" +
        o.materialRequests
          .map(
            (m) =>
              `- **${formatMitchellMaterialKindLabel(m.kind)}:** ${m.message}`,
          )
          .join("\n"),
    );
  }
  if (o.otherAsks.length > 0) {
    parts.push(
      "\n\n### Also need\n\n" + o.otherAsks.map((x) => `- ${x}`).join("\n"),
    );
  }
  if (o.citationsNeeded.length > 0) {
    parts.push(
      "\n\n### Verify or source\n\n" +
        o.citationsNeeded.map((x) => `- ${x}`).join("\n"),
    );
  }
  return parts.join("").trim();
}

export async function runMitchellSectionDraft(
  ctx: FundingOpsAiContext,
  input: {
    sectionGoal: string;
    extraInstructions?: string | null;
    /** One-off paste: CV snippets, bio, etc. Not stored — session only */
    pastedContext?: string | null;
    wordLimit?: number | null;
    opportunity: {
      title: string;
      funderName?: string | null;
      summary?: string | null;
      eligibilityNotes?: string | null;
      productFitAssessmentMd?: string | null;
    };
    knowledgeLinks: { title: string; summary?: string | null; url: string }[];
    approvedCollateral: { title: string; excerpt: string }[];
    grantPageExcerpt?: string | null;
    applicationFormGuidanceExcerpt: string;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "mitchell-section-draft",
    buildSystemPrompt: buildMitchellSystemPrompt,
    moduleDirective: `You are Mitchell drafting ONE application section on the user's behalf.

Rules:
1) Produce draftMarkdown in Markdown. Write a usable first draft using approved collateral excerpts and linked knowledge titles/summaries where they help.
2) Where a fact is missing or uncertain, use a clear placeholder in square brackets, e.g. [YOUR YEARS AT NHS], [LINKEDIN HEADLINE], [PREVIOUS GRANT REFERENCE]. Do not invent employers, dates, qualifications, metrics, or names not in the inputs.
3) blanksToFill: for each major placeholder, say what the user must supply to replace it.
4) materialRequests: ask for concrete evidence types when useful — LinkedIn profile URL, CV/résumé, portfolio, previous successful applications, references, financials. Use the kind enum; message explains why in Mitchell's voice (direct, kind).
5) otherAsks: short free-form lines only if needed.
6) citationsNeeded: what must be checked against the call or portal.

Tone: gruff East London straight-talker with a heart of gold — no corporate fluff, no fake cheer.

If sectionGoal implies a word limit, respect approximately wordLimit when provided (±15%).`,
    userPayload: JSON.stringify(input, null, 2),
    schema: mitchellSectionDraftOutputSchema,
    inputSnapshot: {
      sectionGoalLen: input.sectionGoal.length,
      hasPastedContext: Boolean(input.pastedContext?.trim()),
      knowledgeCount: input.knowledgeLinks.length,
      collateralCount: input.approvedCollateral.length,
      hasGrantExcerpt: Boolean(input.grantPageExcerpt?.trim()),
    },
    temperature: 0.25,
    maxTokens: 8192,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

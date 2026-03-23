import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import { buildMitchellSystemPrompt } from "@/lib/ai/mitchell";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const mitchellIntakeOutputSchema = z.object({
  /** Mitchell's voice: 2–5 short paragraphs markdown */
  briefMarkdown: z.string().min(1),
  /** What only the human can supply (documents, sign-offs, portal checks) */
  asksUserFor: z.array(z.string()).default([]),
  /** What the pipeline already did (fetch, extract, score) — plain bullets */
  whatIDidForYou: z.array(z.string()).default([]),
  /** Map unified form / pack sections to concrete hints using approved collateral and call text */
  sectionWritingHints: z
    .array(
      z.object({
        sectionHeading: z.string(),
        hint: z.string(),
      }),
    )
    .default([]),
  /** Must confirm on portal / PDF, not just this page */
  verifyOnPortal: z.array(z.string()).default([]),
  /** One warm, grounded line — optional */
  heartOfGoldLine: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type MitchellIntakeOutput = z.infer<typeof mitchellIntakeOutputSchema>;

/** Single markdown document for `opportunities.mitchell_brief_md`. */
export function formatMitchellBriefForStorage(o: MitchellIntakeOutput): string {
  const chunks: string[] = [o.briefMarkdown.trim()];
  if (o.whatIDidForYou.length > 0) {
    chunks.push(
      "\n\n### What I sorted for you\n\n" +
        o.whatIDidForYou.map((x) => `- ${x}`).join("\n"),
    );
  }
  if (o.sectionWritingHints.length > 0) {
    chunks.push(
      "\n\n### Writing pointers (against our form scaffold)\n\n" +
        o.sectionWritingHints
          .map((h) => `**${h.sectionHeading}** — ${h.hint}`)
          .join("\n\n"),
    );
  }
  if (o.asksUserFor.length > 0) {
    chunks.push(
      "\n\n### I need from you\n\n" +
        o.asksUserFor.map((x) => `- ${x}`).join("\n"),
    );
  }
  if (o.verifyOnPortal.length > 0) {
    chunks.push(
      "\n\n### Verify on the portal or PDF\n\n" +
        o.verifyOnPortal.map((x) => `- ${x}`).join("\n"),
    );
  }
  if (o.heartOfGoldLine?.trim()) {
    chunks.push(`\n\n---\n\n_${o.heartOfGoldLine.trim()}_`);
  }
  return chunks.join("").trim();
}

export async function runMitchellIntakeBrief(
  ctx: FundingOpsAiContext,
  input: {
    opportunity: {
      title: string;
      funderName?: string | null;
      summary?: string | null;
      eligibilityNotes?: string | null;
      grantUrl?: string | null;
      productFitAssessmentMd?: string | null;
    };
    scoring: {
      eligibilityFit: number;
      restormelFit: number;
      sophiaFit: number;
      cashValue: number;
      burnReductionValue: number;
      effortRequired: number;
      strategicValue: number;
      timeSensitivity: number;
      rationale: string;
    };
    knowledgeLinks: { title: string; summary?: string | null; url: string }[];
    approvedCollateral: { title: string; excerpt: string }[];
    grantPageExcerpt?: string | null;
    /** Unified application form scaffold (truncated in caller) */
    applicationFormGuidanceExcerpt: string;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "mitchell-intake",
    buildSystemPrompt: buildMitchellSystemPrompt,
    moduleDirective: `You are Mitchell finishing an intake pass after the system has already fetched the grant page, extracted fields, and run triage scores.

Your job:
1) briefMarkdown: speak in Mitchell's voice. Say what looks promising, what's thin, what needs checking. Be kind where it's earned — heart of gold — but never soft-soap missing evidence.
2) whatIDidForYou: bullet list of concrete automated steps (e.g. pulled page text, filled summary/eligibility/deadline where possible, ran 8-dimension scores).
3) asksUserFor: only things the human must supply — PDFs, portal-only fields, match funding proof, partner letters, etc. Be specific.
4) sectionWritingHints: tie hints to the unified application scaffold headings (below). Reference approved collateral titles where useful; do not invent facts.
5) verifyOnPortal: deadlines, amounts, eligibility — always flag portal/PDF confirmation.
6) heartOfGoldLine: one short genuine line of encouragement or solidarity.

Keep briefMarkdown usable as the main "Mitchell brief" on the opportunity page.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: mitchellIntakeOutputSchema,
    inputSnapshot: {
      title: input.opportunity.title,
      knowledgeCount: input.knowledgeLinks.length,
      collateralCount: input.approvedCollateral.length,
      hasGrantExcerpt: Boolean(input.grantPageExcerpt?.trim()),
    },
    temperature: 0.2,
    maxTokens: 8192,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

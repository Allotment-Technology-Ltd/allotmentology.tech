import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import { buildMitchellSystemPrompt } from "@/lib/ai/mitchell";
import {
  formatMaterialRequestsMarkdown,
  mitchellMaterialRequestSchema,
} from "@/lib/ai/mitchell-materials";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const mitchellIntakeOutputSchema = z.object({
  /** Mitchell's voice: 2–5 short paragraphs markdown */
  briefMarkdown: z.string().min(1),
  /** One sharp sentence: what could make this bid stand out if the evidence lands (no invention) */
  winningAngle: z.string().optional(),
  /** What assessors might challenge — address these in the narrative with real evidence */
  assessorObjections: z.array(z.string()).default([]),
  /** What only the human can supply (documents, sign-offs, portal checks) */
  asksUserFor: z.array(z.string()).default([]),
  /** Structured asks for evidence: LinkedIn, CV, past applications, etc. */
  materialRequests: z.array(mitchellMaterialRequestSchema).default([]),
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
  if (o.winningAngle?.trim()) {
    chunks.push(
      `\n\n### Angle that could win this\n\n${o.winningAngle.trim()}`,
    );
  }
  if (o.assessorObjections.length > 0) {
    chunks.push(
      "\n\n### What could sink you (address with evidence)\n\n" +
        o.assessorObjections.map((x) => `- ${x}`).join("\n"),
    );
  }
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
  if (o.materialRequests.length > 0) {
    chunks.push(
      "\n\n### Materials that would help me write stronger sections\n\n" +
        formatMaterialRequestsMarkdown(o.materialRequests),
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
1) briefMarkdown: speak in Mitchell's voice. Say what looks promising, what's thin, what needs checking. Be kind where it's earned — heart of gold — but never soft-soap missing evidence. Tie comments to the triage scores and rationale where useful: which dimensions to lean into in narrative (e.g. fit, cash value, effort) and when to be honest that scores are middling.
2) winningAngle: **one sentence** — the sharpest defensible angle that could make this submission competitive if the team backs it with evidence. No hype; if the angle is weak, say so plainly.
3) assessorObjections: 2–6 bullets — what a sceptical panel reviewer might ask or doubt. These are prompts for the writing phase, not insults.
4) whatIDidForYou: bullet list of concrete automated steps (e.g. pulled page text, filled summary/eligibility/deadline where possible, ran 8-dimension scores).
5) materialRequests: when writing later will need evidence, ask for structured items — LinkedIn URL, CV/résumé, portfolio, previous applications, references, financials. Short messages in Mitchell's voice.
6) asksUserFor: other things the human must supply — portal-only fields, match funding proof, partner letters, etc. Be specific.
7) sectionWritingHints: tie hints to the unified application scaffold headings (below). For each, give **tactical** advice: opening hook, evidence to cite, how to show alignment with the funder without generic fluff. Reference approved collateral titles where useful; do not invent facts.
8) verifyOnPortal: deadlines, amounts, eligibility — always flag portal/PDF confirmation.
9) heartOfGoldLine: one short genuine line of encouragement or solidarity.

Keep briefMarkdown usable as the main "Mitchell brief" on the opportunity page.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: mitchellIntakeOutputSchema,
    inputSnapshot: {
      title: input.opportunity.title,
      knowledgeCount: input.knowledgeLinks.length,
      collateralCount: input.approvedCollateral.length,
      hasGrantExcerpt: Boolean(input.grantPageExcerpt?.trim()),
    },
    temperature: 0.22,
    maxTokens: 8192,
  });
  return asGenerated(value, { model: ctx.model, logId });
}

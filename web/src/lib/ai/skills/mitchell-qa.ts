import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const mitchellQaOutputSchema = z.object({
  /** Full answer in Markdown; use [BRACKETS] only where a fact is missing — do not invent. */
  responseMarkdown: z.string().min(1),
});

export type MitchellQaOutput = z.infer<typeof mitchellQaOutputSchema>;

export type MitchellQaStyleProfile = {
  voiceDescription: string | null;
  styleGuardrailsMd: string | null;
  bannedPhrases: string[] | null;
  preferredStructure: string | null;
  samples: { title: string; sampleText: string }[];
};

export async function runMitchellQa(
  ctx: FundingOpsAiContext,
  input: {
    question: string;
    notes: string;
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
    /** Unified form scaffold excerpt (wording / section names). */
    applicationFormGuidanceExcerpt: string;
    writingStyle?: MitchellQaStyleProfile | null;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "mitchell-qa",
    moduleDirective: `You are Mitchell answering ONE application or assessment question for the user.

Inputs:
- **question**: text copied from a form (required).
- **notes**: user's own reminders, constraints, or what assessors care about (may be empty).
- **context**: opportunity summary, eligibility, product fit notes, linked knowledge URLs/summaries, approved collateral excerpts, optional grant page excerpt, optional application form scaffold, optional writing-style profile.

Your job:
1) Write **responseMarkdown** as GitHub-flavoured Markdown: direct answer to the question, suitable to paste into a portal field after the user verifies facts.
2) Ground the answer in the supplied context. If evidence is missing for a claim, use clear placeholders like [CONFIRM DATE] or [ADD METRIC] — never invent funders, partners, pilots, revenue, or eligibility.
3) If **writingStyle** is present, match voice, guardrails, and banned phrases; lean on samples for cadence only (do not copy private data verbatim).
4) Keep Mitchell's voice: plain, straight, short sentences — no corporate filler.
5) If the question is multi-part, structure with headings or numbered bullets so it is easy to split across form fields if needed.

Return JSON only with key responseMarkdown.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: mitchellQaOutputSchema,
    inputSnapshot: {
      title: input.opportunity.title,
      questionChars: input.question.length,
      notesChars: input.notes.length,
      knowledgeCount: input.knowledgeLinks.length,
      collateralCount: input.approvedCollateral.length,
      hasGrantExcerpt: Boolean(input.grantPageExcerpt?.trim()),
      hasWritingStyle: Boolean(input.writingStyle),
    },
    temperature: 0.24,
    maxTokens: 8192,
  });

  return asGenerated(value, { model: ctx.model, logId });
}

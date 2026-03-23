import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const applicationDrafterOutputSchema = z.object({
  sections: z.array(
    z.object({
      key: z.string(),
      markdownDraft: z.string(),
    }),
  ),
  assumptionsMade: z.array(z.string()),
  mustVerify: z.array(z.string()),
  citationsNeeded: z.array(z.string()).default([]),
  bannedPhraseHits: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ApplicationDrafterOutput = z.infer<
  typeof applicationDrafterOutputSchema
>;

export async function runApplicationDrafter(
  ctx: FundingOpsAiContext,
  input: {
    brief: string;
    sectionKeys?: string[];
    tone?: string;
    styleProfile?: {
      voiceDescription?: string | null;
      guardrails?: string | null;
      bannedPhrases?: string[] | null;
      preferredStructure?: string | null;
      samples?: Array<{ title: string; sampleText: string }>;
    };
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "subagent",
    moduleName: "application-drafter",
    moduleDirective: `You draft application sections in Markdown from the brief.
Label assumptions explicitly in assumptionsMade. Never present guesses as verified facts.
Do not advise submission; output is draft-only for human edit.
Apply styleProfile cues when provided and avoid banned phrases.
Use concrete language, avoid generic AI boilerplate.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: applicationDrafterOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

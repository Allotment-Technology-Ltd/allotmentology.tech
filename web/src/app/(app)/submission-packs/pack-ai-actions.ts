"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  knowledgeAssets,
  opportunities,
  opportunityKnowledgeAssets,
  submissionPacks,
  writingStyleProfiles,
  writingStyleSamples,
} from "@/db/schema/tables";
import { AiNotConfiguredError, AiParseError, AiProviderError } from "@/lib/ai/errors";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";
import { tryCreateFundingOpsAiContext } from "@/lib/ai/runtime";
import { generateApplicationPack } from "@/lib/ai/skills/generate-application-pack";
import { runApplicationDrafter } from "@/lib/ai/subagents/application-drafter";

export type PackDraftAiResult =
  | {
      ok: true;
      fragments: Record<string, string>;
      missingInputs: string[];
      risks: string[];
      citationsNeeded: string[];
      evidenceBackedClaims: string[];
      reviewChecklist: string[];
      confidence: number;
      bannedPhraseHits: string[];
      model: string;
      logId: string;
    }
  | { ok: false; error: string };

export async function generatePackDraftAi(packId: string): Promise<PackDraftAiResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    if (!z.string().uuid().safeParse(packId).success) {
      return { ok: false, error: "Invalid pack id." };
    }

    const db = getServerDb();
    const [row] = await db
      .select({
        pack: submissionPacks,
        opportunity: opportunities,
      })
      .from(submissionPacks)
      .innerJoin(
        opportunities,
        eq(submissionPacks.opportunityId, opportunities.id),
      )
      .where(eq(submissionPacks.id, packId))
      .limit(1);

    if (!row) {
      return { ok: false, error: "Submission pack not found." };
    }

    const linkedKnowledge = await db
      .select({
        title: knowledgeAssets.title,
        sourceType: knowledgeAssets.sourceType,
        url: knowledgeAssets.url,
        summary: knowledgeAssets.summary,
        relevanceNote: opportunityKnowledgeAssets.relevanceNote,
        priority: opportunityKnowledgeAssets.priority,
      })
      .from(opportunityKnowledgeAssets)
      .innerJoin(
        knowledgeAssets,
        eq(opportunityKnowledgeAssets.knowledgeAssetId, knowledgeAssets.id),
      )
      .where(eq(opportunityKnowledgeAssets.opportunityId, row.opportunity.id));

    const [styleProfile] =
      row.opportunity.ownerUserId == null
        ? []
        : await db
            .select({
              id: writingStyleProfiles.id,
              voiceDescription: writingStyleProfiles.voiceDescription,
              styleGuardrailsMd: writingStyleProfiles.styleGuardrailsMd,
              bannedPhrases: writingStyleProfiles.bannedPhrases,
              preferredStructure: writingStyleProfiles.preferredStructure,
            })
            .from(writingStyleProfiles)
            .where(eq(writingStyleProfiles.ownerUserId, row.opportunity.ownerUserId))
            .limit(1);

    const styleSamples = styleProfile
      ? await db
          .select({
            title: writingStyleSamples.title,
            sampleText: writingStyleSamples.sampleText,
          })
          .from(writingStyleSamples)
          .where(eq(writingStyleSamples.profileId, styleProfile.id))
          .limit(5)
      : [];

    const userId = await getAppUserIdByEmail(email);
    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: row.opportunity.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY (or Restormel env vars) on the server.",
      };
    }

    const snippets: Record<string, string> = {};
    if (row.pack.workingThesis.trim()) {
      snippets.working_thesis = row.pack.workingThesis;
    }
    if (row.pack.projectFraming.trim()) {
      snippets.project_framing = row.pack.projectFraming;
    }
    if (row.pack.summary100.trim()) {
      snippets.summary_100 = row.pack.summary100;
    }
    if (row.pack.summary250.trim()) {
      snippets.summary_250 = row.pack.summary250;
    }

    const gen = await generateApplicationPack(ctx, {
      opportunityTitle: row.opportunity.title,
      eligibilityNotes: row.opportunity.eligibilityNotes ?? undefined,
      collateralSnippets:
        Object.keys(snippets).length > 0 ? snippets : undefined,
      knowledgeLinks: linkedKnowledge,
      styleProfile: styleProfile
        ? {
            voiceDescription: styleProfile.voiceDescription,
            styleGuardrailsMd: styleProfile.styleGuardrailsMd,
            bannedPhrases: styleProfile.bannedPhrases,
            preferredStructure: styleProfile.preferredStructure,
            samples: styleSamples,
          }
        : undefined,
    });

    const draftLoop = await runApplicationDrafter(ctx, {
      brief: [
        `Opportunity: ${row.opportunity.title}`,
        `Use these draft fragments as base material and tighten to founder-style voice.`,
        JSON.stringify(gen.value.packFragments, null, 2),
      ].join("\n\n"),
      sectionKeys: Object.keys(gen.value.packFragments),
      styleProfile: styleProfile
        ? {
            voiceDescription: styleProfile.voiceDescription,
            guardrails: styleProfile.styleGuardrailsMd,
            bannedPhrases: styleProfile.bannedPhrases,
            preferredStructure: styleProfile.preferredStructure,
            samples: styleSamples,
          }
        : undefined,
    });

    const revised = Object.fromEntries(
      draftLoop.value.sections.map((s) => [s.key, s.markdownDraft]),
    );

    return {
      ok: true,
      fragments: Object.keys(revised).length > 0 ? revised : gen.value.packFragments,
      missingInputs: Array.from(
        new Set([...gen.value.missingInputs, ...draftLoop.value.mustVerify]),
      ),
      risks: gen.value.risks,
      citationsNeeded: Array.from(
        new Set([...(gen.value.citationsNeeded ?? []), ...(draftLoop.value.citationsNeeded ?? [])]),
      ),
      evidenceBackedClaims: gen.value.evidenceBackedClaims ?? [],
      reviewChecklist: Array.from(
        new Set([
          ...(gen.value.reviewChecklist ?? []),
          "Confirm all factual claims against linked source materials before submission.",
        ]),
      ),
      confidence:
        Math.round(
          ((gen.value.confidence ?? 0.5) + (draftLoop.value.confidence ?? 0.5)) * 50,
        ) / 100,
      bannedPhraseHits: Array.from(
        new Set([
          ...(gen.value.bannedPhraseHits ?? []),
          ...(draftLoop.value.bannedPhraseHits ?? []),
        ]),
      ),
      model: gen.model,
      logId: gen.logId,
    };
  } catch (e) {
    if (e instanceof AiNotConfiguredError) {
      return { ok: false, error: e.message };
    }
    if (e instanceof AiParseError) {
      return { ok: false, error: `Could not parse AI output: ${e.message}` };
    }
    if (e instanceof AiProviderError) {
      return { ok: false, error: e.message };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "AI request failed.",
    };
  }
}

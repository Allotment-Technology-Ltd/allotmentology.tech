"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { opportunities, submissionPacks } from "@/db/schema/tables";
import { AiNotConfiguredError, AiParseError, AiProviderError } from "@/lib/ai/errors";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";
import { tryCreateFundingOpsAiContext } from "@/lib/ai/runtime";
import { generateApplicationPack } from "@/lib/ai/skills/generate-application-pack";

export type PackDraftAiResult =
  | {
      ok: true;
      fragments: Record<string, string>;
      missingInputs: string[];
      risks: string[];
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

    const userId = await getAppUserIdByEmail(email);
    const ctx = tryCreateFundingOpsAiContext({
      userId,
      opportunityId: row.opportunity.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Set AI_API_KEY or OPENAI_API_KEY in the environment.",
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
    });

    return {
      ok: true,
      fragments: gen.value.packFragments,
      missingInputs: gen.value.missingInputs,
      risks: gen.value.risks,
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

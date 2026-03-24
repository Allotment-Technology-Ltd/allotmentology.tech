"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  collateralItems,
  knowledgeAssets,
  opportunities,
  opportunityKnowledgeAssets,
  opportunityScores,
  writingStyleProfiles,
  writingStyleSamples,
} from "@/db/schema/tables";
import { AiNotConfiguredError, AiParseError, AiProviderError } from "@/lib/ai/errors";
import { logAiProviderErrorForRoute } from "@/lib/ai/log-provider-failure";
import { augmentProviderErrorMessage } from "@/lib/ai/provider-error-hints";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";
import {
  tryCreateFundingOpsAiContext,
  type FundingOpsAiContext,
} from "@/lib/ai/runtime";
import { chooseNarrativeAngle } from "@/lib/ai/skills/choose-narrative-angle";
import { extractGrantDetails } from "@/lib/ai/skills/extract-grant-details";
import {
  formatMitchellBriefForStorage,
  runMitchellIntakeBrief,
} from "@/lib/ai/skills/mitchell-intake";
import {
  runMitchellQa,
  type MitchellQaStyleProfile,
} from "@/lib/ai/skills/mitchell-qa";
import { runOpportunityFullScoring } from "@/lib/ai/skills/opportunity-full-scoring";
import { DEFAULT_APPLICATION_FORMS_MD } from "@/lib/submission-packs/application-forms-template";
import { detectScopeConflict } from "@/lib/ai/skills/detect-scope-conflict";
import { runOpportunityScout } from "@/lib/ai/subagents/opportunity-scout";
import { fetchGrantPagePlainText } from "@/lib/grant-url/fetch-page-text";

export type SummariseAiResult =
  | {
      ok: true;
      data: {
        headlineSummary: string;
        funderHypothesis: string[];
        followUpQuestions: string[];
        confidence: string;
        caveats: string[];
      };
      model: string;
      logId: string;
    }
  | { ok: false; error: string };

export type ChooseAngleAiResult =
  | {
      ok: true;
      data: {
        primaryAngle: string;
        alternates: string[];
        evidenceToGather: string[];
      };
      model: string;
      logId: string;
    }
  | { ok: false; error: string };

export type SuggestConflictsAiResult =
  | {
      ok: true;
      data: {
        conflicts: { description: string; severity: string }[];
        safeToMerge: boolean;
        notes: string;
      };
      model: string;
      logId: string;
    }
  | { ok: false; error: string };

async function loadOpportunityOrError(
  opportunityId: string,
): Promise<
  | { ok: true; opportunity: typeof opportunities.$inferSelect }
  | { ok: false; error: string }
> {
  if (!z.string().uuid().safeParse(opportunityId).success) {
    return { ok: false, error: "Invalid opportunity id." };
  }
  const db = getServerDb();
  const [o] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);
  if (!o) {
    return { ok: false, error: "Opportunity not found." };
  }
  return { ok: true, opportunity: o };
}

function handleAiError(e: unknown): { ok: false; error: string } {
  if (e instanceof AiNotConfiguredError) {
    return { ok: false, error: e.message };
  }
  if (e instanceof AiParseError) {
    return { ok: false, error: `Could not parse AI output: ${e.message}` };
  }
  if (e instanceof AiProviderError) {
    logAiProviderErrorForRoute("opportunity.ai", e);
    return { ok: false, error: augmentProviderErrorMessage(e.message, e.status) };
  }
  return {
    ok: false,
    error: e instanceof Error ? e.message : "AI request failed.",
  };
}

export async function summariseOpportunityAi(
  opportunityId: string,
): Promise<SummariseAiResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const userId = await getAppUserIdByEmail(email);
    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const rawDescription = [
      `Title: ${o.title}`,
      o.funderName ? `Funder: ${o.funderName}` : null,
      o.summary ? `Summary:\n${o.summary}` : null,
      o.eligibilityNotes ? `Eligibility notes:\n${o.eligibilityNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const gen = await runOpportunityScout(ctx, {
      rawDescription,
      sourceLabel: "opportunity record",
    });

    return {
      ok: true,
      data: gen.value,
      model: gen.model,
      logId: gen.logId,
    };
  } catch (e) {
    return handleAiError(e);
  }
}

export async function chooseNarrativeAngleAi(
  opportunityId: string,
): Promise<ChooseAngleAiResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const userId = await getAppUserIdByEmail(email);
    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const gen = await chooseNarrativeAngle(ctx, {
      opportunityTitle: o.title,
      audience: o.funderName ?? undefined,
      productSummary: o.summary ?? undefined,
      constraints: o.eligibilityNotes
        ? ["Eligibility / constraints from opportunity record", o.eligibilityNotes]
        : undefined,
    });

    return {
      ok: true,
      data: gen.value,
      model: gen.model,
      logId: gen.logId,
    };
  } catch (e) {
    return handleAiError(e);
  }
}

export async function suggestConflictsAi(
  opportunityId: string,
): Promise<SuggestConflictsAiResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const userId = await getAppUserIdByEmail(email);
    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const scopeA = [
      o.summary ? `Public / summary:\n${o.summary}` : "",
      o.eligibilityNotes ? `Eligibility:\n${o.eligibilityNotes}` : "",
    ]
      .filter((s) => s.length > 0)
      .join("\n\n")
      .trim();

    const scopeB =
      o.internalNotes?.trim() ??
      "(No internal notes — comparing summary vs eligibility only is weak signal.)";

    if (!scopeA) {
      return {
        ok: false,
        error:
          "Add a summary or eligibility notes before running conflict suggestions.",
      };
    }

    const gen = await detectScopeConflict(ctx, {
      scopeA,
      scopeB,
      labels: ["Summary + eligibility", "Internal notes"],
    });

    return {
      ok: true,
      data: gen.value,
      model: gen.model,
      logId: gen.logId,
    };
  } catch (e) {
    return handleAiError(e);
  }
}

export type EnrichGrantUrlResult =
  | { ok: true; model: string; logId: string }
  | { ok: false; error: string };

export type AiFullScoringResult =
  | { ok: true; model: string; logId: string }
  | { ok: false; error: string };

function parseOptionalIso(s: string | null | undefined): Date | null {
  if (s == null || typeof s !== "string" || s.trim() === "") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function loadApprovedCollateralExcerpts() {
  const db = getServerDb();
  const rows = await db
    .select({
      title: collateralItems.title,
      body: collateralItems.body,
    })
    .from(collateralItems)
    .where(eq(collateralItems.approved, true))
    .orderBy(asc(collateralItems.title))
    .limit(30);
  return rows.map((r) => ({
    title: r.title,
    excerpt: r.body.replace(/\s+/g, " ").trim().slice(0, 600),
  }));
}

async function loadKnowledgeForOpportunity(opportunityId: string) {
  const db = getServerDb();
  return db
    .select({
      title: knowledgeAssets.title,
      summary: knowledgeAssets.summary,
      url: knowledgeAssets.url,
    })
    .from(opportunityKnowledgeAssets)
    .innerJoin(
      knowledgeAssets,
      eq(opportunityKnowledgeAssets.knowledgeAssetId, knowledgeAssets.id),
    )
    .where(eq(opportunityKnowledgeAssets.opportunityId, opportunityId))
    .orderBy(desc(opportunityKnowledgeAssets.priority), asc(knowledgeAssets.title));
}

async function loadWritingStyleBundleForOwner(
  ownerUserId: string | null,
): Promise<MitchellQaStyleProfile | null> {
  if (!ownerUserId) return null;
  const db = getServerDb();
  const [profile] = await db
    .select({
      id: writingStyleProfiles.id,
      voiceDescription: writingStyleProfiles.voiceDescription,
      styleGuardrailsMd: writingStyleProfiles.styleGuardrailsMd,
      bannedPhrases: writingStyleProfiles.bannedPhrases,
      preferredStructure: writingStyleProfiles.preferredStructure,
    })
    .from(writingStyleProfiles)
    .where(eq(writingStyleProfiles.ownerUserId, ownerUserId))
    .limit(1);
  if (!profile) return null;
  const samples = await db
    .select({
      title: writingStyleSamples.title,
      sampleText: writingStyleSamples.sampleText,
    })
    .from(writingStyleSamples)
    .where(eq(writingStyleSamples.profileId, profile.id))
    .limit(5);
  return {
    voiceDescription: profile.voiceDescription,
    styleGuardrailsMd: profile.styleGuardrailsMd,
    bannedPhrases: profile.bannedPhrases,
    preferredStructure: profile.preferredStructure,
    samples,
  };
}

function scoreDim(n: number | null | undefined, fallback: number): number {
  if (n == null || n < 1 || n > 5) return fallback;
  return n;
}

/**
 * Fetch grant page text, run extract-grant-details, persist fields on the opportunity row.
 */
async function extractGrantIntoOpportunity(
  opportunityId: string,
  o: typeof opportunities.$inferSelect,
  ctx: FundingOpsAiContext,
): Promise<
  | { ok: false; error: string }
  | {
      ok: true;
      fetched: { text: string; finalUrl: string };
      extractLogId: string;
      extractModel: string;
    }
> {
  const grantUrl = o.grantUrl?.trim();
  if (!grantUrl) {
    return { ok: false, error: "Add and save a grant URL first." };
  }

  const fetched = await fetchGrantPagePlainText(grantUrl);
  if (!fetched.ok) {
    return { ok: false, error: fetched.error };
  }

  const approvedCollateral = await loadApprovedCollateralExcerpts();
  const gen = await extractGrantDetails(ctx, {
    pageText: fetched.text,
    pageUrl: fetched.finalUrl,
    existingTitle: o.title,
    approvedCollateral,
  });

  const v = gen.value;
  const db = getServerDb();
  const closesAt = parseOptionalIso(v.closesAtIso ?? null);
  const estRaw = v.estimatedValue?.trim().replace(/,/g, "") ?? "";
  const est =
    estRaw && /^[0-9]+(\.[0-9]+)?$/.test(estRaw) ? estRaw : null;

  await db
    .update(opportunities)
    .set({
      summary: v.summary?.trim() ? v.summary.trim() : o.summary,
      eligibilityNotes: v.eligibilityNotes?.trim()
        ? v.eligibilityNotes.trim()
        : o.eligibilityNotes,
      closesAt: closesAt ?? o.closesAt,
      estimatedValue: est ?? o.estimatedValue,
      currencyCode:
        v.currencyCode && /^[A-Z]{3}$/i.test(v.currencyCode)
          ? v.currencyCode.toUpperCase()
          : o.currencyCode,
      funderName: v.funderName?.trim() ? v.funderName.trim() : o.funderName,
      productFitAssessmentMd: v.productFitAssessmentMd?.trim()
        ? v.productFitAssessmentMd.trim()
        : o.productFitAssessmentMd,
      updatedAt: new Date(),
    })
    .where(eq(opportunities.id, opportunityId));

  return {
    ok: true,
    fetched,
    extractLogId: gen.logId,
    extractModel: gen.model,
  };
}

/**
 * Fetch the grant URL, extract structured fields + product weighting, persist on the opportunity.
 */
export async function enrichOpportunityFromGrantUrl(
  opportunityId: string,
): Promise<EnrichGrantUrlResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const userId = await getAppUserIdByEmail(email);
    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const ex = await extractGrantIntoOpportunity(opportunityId, o, ctx);
    if (!ex.ok) {
      return ex;
    }

    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath(`/opportunities/${opportunityId}/edit`);

    return { ok: true, model: ex.extractModel, logId: ex.extractLogId };
  } catch (e) {
    return handleAiError(e);
  }
}

const mitchellQaParamsSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Paste or type the application question.")
    .max(20000),
  notes: z.string().trim().max(20000).optional().default(""),
});

export type MitchellQaActionResult =
  | { ok: true; model: string; logId: string; responseMarkdown: string }
  | { ok: false; error: string };

/**
 * Mitchell Q&A for a known app user (session or API token). Persists `mitchell_qa_*` columns.
 */
export async function executeMitchellQaForOpportunityUser(
  userId: string,
  opportunityId: string,
  params: z.infer<typeof mitchellQaParamsSchema>,
  options?: { revalidate?: boolean },
): Promise<MitchellQaActionResult> {
  try {
    const parsed = mitchellQaParamsSchema.safeParse(params);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
      };
    }

    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const [knowledgeLinks, approvedCollateral, writingStyle] = await Promise.all([
      loadKnowledgeForOpportunity(opportunityId),
      loadApprovedCollateralExcerpts(),
      loadWritingStyleBundleForOwner(o.ownerUserId),
    ]);

    let grantPageExcerpt: string | null = null;
    const grantUrl = o.grantUrl?.trim();
    if (grantUrl) {
      const fetched = await fetchGrantPagePlainText(grantUrl);
      if (fetched.ok) {
        grantPageExcerpt = fetched.text.slice(0, 12_000);
      }
    }

    const p = parsed.data;
    const gen = await runMitchellQa(ctx, {
      question: p.question,
      notes: p.notes,
      opportunity: {
        title: o.title,
        funderName: o.funderName,
        summary: o.summary,
        eligibilityNotes: o.eligibilityNotes,
        productFitAssessmentMd: o.productFitAssessmentMd,
      },
      knowledgeLinks: knowledgeLinks.map((k) => ({
        title: k.title,
        summary: k.summary,
        url: k.url,
      })),
      approvedCollateral,
      grantPageExcerpt,
      applicationFormGuidanceExcerpt: DEFAULT_APPLICATION_FORMS_MD.slice(0, 6000),
      writingStyle,
    });

    const responseMd = gen.value.responseMarkdown.trim();
    const db = getServerDb();
    await db
      .update(opportunities)
      .set({
        mitchellQaQuestionMd: p.question,
        mitchellQaNotesMd: p.notes.trim() ? p.notes.trim() : null,
        mitchellQaResponseMd: responseMd,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    const shouldRevalidate = options?.revalidate !== false;
    if (shouldRevalidate) {
      revalidatePath(`/opportunities/${opportunityId}`);
      revalidatePath(`/opportunities/${opportunityId}/edit`);
    }

    return {
      ok: true,
      model: gen.model,
      logId: gen.logId,
      responseMarkdown: responseMd,
    };
  } catch (e) {
    return handleAiError(e);
  }
}

/**
 * Mitchell answers a single application question using opportunity context, linked knowledge,
 * approved collateral, optional grant page text, form scaffold, and the owner’s writing style.
 * Persists `mitchell_qa_*` columns.
 */
export async function runMitchellQaForOpportunity(
  opportunityId: string,
  params: z.infer<typeof mitchellQaParamsSchema>,
): Promise<MitchellQaActionResult> {
  const { email } = await getSessionUserEmailOrRedirect();
  const userId = await getAppUserIdByEmail(email);
  if (!userId) {
    return { ok: false, error: "Local user profile missing; reload and try again." };
  }
  return executeMitchellQaForOpportunityUser(userId, opportunityId, params);
}

export type MitchellGrantIntakeResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Mitchell intake: fetch grant page → extract fields → full triage scores → Mitchell brief
 * (persona + asks + writing hints using unified form scaffold). Persists `mitchell_brief_md`.
 */
export async function runMitchellGrantIntake(
  opportunityId: string,
): Promise<MitchellGrantIntakeResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }

    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const ex = await extractGrantIntoOpportunity(opportunityId, o, ctx);
    if (!ex.ok) {
      return ex;
    }

    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath(`/opportunities/${opportunityId}/edit`);

    const scoringR = await runAiFullOpportunityScoring(opportunityId, {
      preFetchedGrantExcerpt: ex.fetched.text,
    });
    if (!scoringR.ok) {
      return { ok: false, error: scoringR.error };
    }

    const db = getServerDb();
    const [o2] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId))
      .limit(1);
    const [sc] = await db
      .select()
      .from(opportunityScores)
      .where(eq(opportunityScores.opportunityId, opportunityId))
      .limit(1);

    if (!o2 || !sc?.rationale) {
      return {
        ok: false,
        error: "Scoring did not produce a rationale; try again.",
      };
    }

    const [knowledgeLinks, approvedCollateral] = await Promise.all([
      loadKnowledgeForOpportunity(opportunityId),
      loadApprovedCollateralExcerpts(),
    ]);

    const mitchellGen = await runMitchellIntakeBrief(ctx, {
      opportunity: {
        title: o2.title,
        funderName: o2.funderName,
        summary: o2.summary,
        eligibilityNotes: o2.eligibilityNotes,
        grantUrl: o2.grantUrl,
        productFitAssessmentMd: o2.productFitAssessmentMd,
      },
      scoring: {
        eligibilityFit: scoreDim(sc.eligibilityFit, 3),
        restormelFit: scoreDim(sc.restormelFit, 3),
        sophiaFit: scoreDim(sc.sophiaFit, 3),
        cashValue: scoreDim(sc.cashValue, 3),
        burnReductionValue: scoreDim(sc.burnReductionValue, 3),
        effortRequired: scoreDim(sc.effortRequired, 3),
        strategicValue: scoreDim(sc.strategicValue, 3),
        timeSensitivity: scoreDim(sc.timeSensitivity, 3),
        rationale: sc.rationale,
      },
      knowledgeLinks: knowledgeLinks.map((k) => ({
        title: k.title,
        summary: k.summary,
        url: k.url,
      })),
      approvedCollateral,
      grantPageExcerpt: ex.fetched.text.slice(0, 12_000),
      applicationFormGuidanceExcerpt: DEFAULT_APPLICATION_FORMS_MD.slice(0, 6000),
    });

    const briefMd = formatMitchellBriefForStorage(mitchellGen.value);

    await db
      .update(opportunities)
      .set({
        mitchellBriefMd: briefMd,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath(`/opportunities/${opportunityId}/edit`);

    return { ok: true };
  } catch (e) {
    return handleAiError(e);
  }
}

/**
 * Populate all triage score dimensions + rationale from opportunity context (including grant URL text when present).
 * Pass `preFetchedGrantExcerpt` to avoid a second fetch when the page was already loaded (e.g. Mitchell intake).
 */
export async function runAiFullOpportunityScoring(
  opportunityId: string,
  options?: { preFetchedGrantExcerpt?: string | null },
): Promise<AiFullScoringResult> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const loaded = await loadOpportunityOrError(opportunityId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error };
    }
    const o = loaded.opportunity;

    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }

    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: o.id,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    const [knowledgeLinks, approvedCollateral] = await Promise.all([
      loadKnowledgeForOpportunity(opportunityId),
      loadApprovedCollateralExcerpts(),
    ]);

    let grantPageExcerpt: string | null = null;
    if (options?.preFetchedGrantExcerpt !== undefined) {
      const raw = options.preFetchedGrantExcerpt;
      grantPageExcerpt =
        raw != null && raw.trim() !== "" ? raw.slice(0, 12_000) : null;
    } else {
      const grantUrl = o.grantUrl?.trim();
      if (grantUrl) {
        const fetched = await fetchGrantPagePlainText(grantUrl);
        if (fetched.ok) {
          grantPageExcerpt = fetched.text.slice(0, 12_000);
        }
      }
    }

    const gen = await runOpportunityFullScoring(ctx, {
      opportunity: {
        title: o.title,
        funderName: o.funderName,
        summary: o.summary,
        eligibilityNotes: o.eligibilityNotes,
        internalNotes: o.internalNotes,
        grantUrl: o.grantUrl,
        productFitAssessmentMd: o.productFitAssessmentMd,
      },
      knowledgeLinks: knowledgeLinks.map((k) => ({
        title: k.title,
        summary: k.summary,
        url: k.url,
      })),
      approvedCollateral,
      grantPageExcerpt,
    });

    const s = gen.value;
    const db = getServerDb();
    const now = new Date();

    await db
      .insert(opportunityScores)
      .values({
        opportunityId,
        eligibilityFit: s.eligibilityFit,
        restormelFit: s.restormelFit,
        sophiaFit: s.sophiaFit,
        cashValue: s.cashValue,
        burnReductionValue: s.burnReductionValue,
        effortRequired: s.effortRequired,
        strategicValue: s.strategicValue,
        timeSensitivity: s.timeSensitivity,
        rationale: s.rationale,
        scoredByUserId: userId,
        scoredAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: opportunityScores.opportunityId,
        set: {
          eligibilityFit: s.eligibilityFit,
          restormelFit: s.restormelFit,
          sophiaFit: s.sophiaFit,
          cashValue: s.cashValue,
          burnReductionValue: s.burnReductionValue,
          effortRequired: s.effortRequired,
          strategicValue: s.strategicValue,
          timeSensitivity: s.timeSensitivity,
          rationale: s.rationale,
          scoredByUserId: userId,
          scoredAt: now,
          updatedAt: now,
        },
      });

    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath(`/opportunities/${opportunityId}/edit`);

    return { ok: true, model: gen.model, logId: gen.logId };
  } catch (e) {
    return handleAiError(e);
  }
}

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
} from "@/db/schema/tables";
import { AiNotConfiguredError, AiParseError, AiProviderError } from "@/lib/ai/errors";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";
import { tryCreateFundingOpsAiContext } from "@/lib/ai/runtime";
import { chooseNarrativeAngle } from "@/lib/ai/skills/choose-narrative-angle";
import { extractGrantDetails } from "@/lib/ai/skills/extract-grant-details";
import { runOpportunityFullScoring } from "@/lib/ai/skills/opportunity-full-scoring";
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
    return { ok: false, error: e.message };
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
    const grantUrl = o.grantUrl?.trim();
    if (!grantUrl) {
      return { ok: false, error: "Add and save a grant URL first." };
    }

    const fetched = await fetchGrantPagePlainText(grantUrl);
    if (!fetched.ok) {
      return { ok: false, error: fetched.error };
    }

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

    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath(`/opportunities/${opportunityId}/edit`);

    return { ok: true, model: gen.model, logId: gen.logId };
  } catch (e) {
    return handleAiError(e);
  }
}

/**
 * Populate all triage score dimensions + rationale from opportunity context (including grant URL text when present).
 */
export async function runAiFullOpportunityScoring(
  opportunityId: string,
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
    const grantUrl = o.grantUrl?.trim();
    if (grantUrl) {
      const fetched = await fetchGrantPagePlainText(grantUrl);
      if (fetched.ok) {
        grantPageExcerpt = fetched.text.slice(0, 12_000);
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

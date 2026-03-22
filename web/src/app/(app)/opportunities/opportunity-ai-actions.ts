"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { opportunities } from "@/db/schema/tables";
import { AiNotConfiguredError, AiParseError, AiProviderError } from "@/lib/ai/errors";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";
import { tryCreateFundingOpsAiContext } from "@/lib/ai/runtime";
import { chooseNarrativeAngle } from "@/lib/ai/skills/choose-narrative-angle";
import { detectScopeConflict } from "@/lib/ai/skills/detect-scope-conflict";
import { runOpportunityScout } from "@/lib/ai/subagents/opportunity-scout";

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
    const ctx = tryCreateFundingOpsAiContext({ userId, opportunityId: o.id });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Set AI_API_KEY or OPENAI_API_KEY in the environment.",
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
    const ctx = tryCreateFundingOpsAiContext({ userId, opportunityId: o.id });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Set AI_API_KEY or OPENAI_API_KEY in the environment.",
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
    const ctx = tryCreateFundingOpsAiContext({ userId, opportunityId: o.id });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Set AI_API_KEY or OPENAI_API_KEY in the environment.",
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

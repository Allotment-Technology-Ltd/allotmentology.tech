"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fundingDiscoveryBriefs, opportunities } from "@/db/schema/tables";
import { AiNotConfiguredError, AiParseError, AiProviderError } from "@/lib/ai/errors";
import { logAiProviderErrorForRoute } from "@/lib/ai/log-provider-failure";
import { augmentProviderErrorMessage } from "@/lib/ai/provider-error-hints";
import { tryCreateFundingOpsAiContext } from "@/lib/ai/runtime";
import type { FundingDiscoveryLead } from "@/lib/ai/skills/mitchell-funding-discovery";
import {
  fundingDiscoveryLeadSchema,
  runMitchellFundingDiscovery,
} from "@/lib/ai/skills/mitchell-funding-discovery";
import { runFundingSearchQueryExpansion } from "@/lib/ai/skills/funding-search-query-expansion";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";
import { enrichTavilyResultsWithFetchedPages } from "@/lib/funding-search/enrich-page-text";
import { isTavilyConfigured } from "@/lib/funding-search/tavily-env";
import {
  mergeTavilyResults,
  normalizeResultUrl,
  searchTavily,
} from "@/lib/funding-search/tavily";
import type { TavilyResultInput } from "@/lib/ai/skills/mitchell-funding-discovery";

const userBriefSchema = z
  .string()
  .trim()
  .min(20, "Describe what you are looking for in at least a sentence or two.")
  .max(8000);

function handleAiError(e: unknown): { ok: false; error: string } {
  if (e instanceof AiNotConfiguredError) {
    return { ok: false, error: e.message };
  }
  if (e instanceof AiParseError) {
    return { ok: false, error: `Could not parse AI output: ${e.message}` };
  }
  if (e instanceof AiProviderError) {
    logAiProviderErrorForRoute("opportunities.funding-discovery", e);
    return { ok: false, error: augmentProviderErrorMessage(e.message, e.status) };
  }
  return {
    ok: false,
    error: e instanceof Error ? e.message : "AI request failed.",
  };
}

function parseClosesAt(iso: string | null | undefined): Date | null {
  if (iso == null || typeof iso !== "string" || !iso.trim()) return null;
  const d = new Date(iso.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildFallbackFundingQueries(userBrief: string): string[] {
  const normalized = userBrief.toLowerCase().replace(/\s+/g, " ");
  const geo =
    normalized.match(
      /\b(uk|united kingdom|england|scotland|wales|europe|eu|usa|united states|canada|australia)\b/,
    )?.[0] ?? "UK";
  const sectorHints = [
    "ai",
    "startup",
    "saas",
    "deeptech",
    "research",
    "cloud",
    "developer tools",
  ].filter((h) => normalized.includes(h));
  const sector = sectorHints.length > 0 ? sectorHints.slice(0, 3).join(" ") : "startup";
  const base = `${geo} ${sector}`.trim();
  return [
    `${base} grant programme seed pre-seed`,
    `${base} cloud credits startup programme`,
    `${base} innovation funding accelerator`,
  ];
}

function buildFallbackLeadsFromSearchResults(
  results: TavilyResultInput[],
): FundingDiscoveryLead[] {
  const seen = new Set<string>();
  const leads: FundingDiscoveryLead[] = [];
  const badSignals = [
    "linkedin.com",
    "lesswrong.com",
    "wikipedia.org",
    "youtube.com",
    "epistemolog",
    "philosophy",
  ];
  const fundingSignals = [
    "grant",
    "funding",
    "programme",
    "program",
    "accelerator",
    "credit",
    "voucher",
    "innovation",
    "startup",
    "scheme",
    "r&d",
    "research",
  ];

  for (const r of results) {
    const haystack = `${r.title} ${r.content} ${r.url}`.toLowerCase();
    if (badSignals.some((s) => haystack.includes(s))) continue;
    const signalCount = fundingSignals.filter((s) => haystack.includes(s)).length;
    if (signalCount === 0) continue;

    const grantUrl = normalizeResultUrl(r.url);
    if (seen.has(grantUrl)) continue;
    seen.add(grantUrl);

    const summary = r.content.trim().slice(0, 700);
    const confidence: FundingDiscoveryLead["confidence"] =
      typeof r.score === "number" && r.score >= 0.85 && signalCount >= 4 && summary.length >= 240
        ? "high"
        : typeof r.score === "number" && r.score >= 0.55 && signalCount >= 2
          ? "medium"
          : signalCount >= 3 || summary.length >= 160
            ? "medium"
            : "low";
    leads.push({
      title: r.title.trim().slice(0, 200) || "Funding opportunity",
      funderName: null,
      summary:
        summary.length > 0
          ? summary
          : "Potential funding programme found from web search results.",
      grantUrl,
      closesAtIso: null,
      tags: ["web_search", "manual_review_needed"],
      eligibilityNotes:
        "Auto-generated fallback lead because structured AI output failed. Review source page before importing.",
      confidence,
      caveats: [
        "Generated from search snippets only; details may be incomplete.",
        "Confirm eligibility, deadlines, and current programme status on the source page.",
      ],
    });

    if (leads.length >= 8) break;
  }

  // If filters are too strict, still provide a minimal fallback from top results.
  if (leads.length === 0) {
    for (const r of results.slice(0, 5)) {
      const grantUrl = normalizeResultUrl(r.url);
      if (seen.has(grantUrl)) continue;
      seen.add(grantUrl);
      leads.push({
        title: r.title.trim().slice(0, 200) || "Funding opportunity",
        funderName: null,
        summary:
          r.content.trim().slice(0, 700) ||
          "Potential funding programme found from web search results.",
        grantUrl,
        closesAtIso: null,
        tags: ["web_search", "manual_review_needed"],
        eligibilityNotes:
          "Auto-generated fallback lead because structured AI output failed. Review source page before importing.",
        confidence: "low",
        caveats: [
          "Generated from search snippets only; details may be incomplete.",
          "Confirm eligibility, deadlines, and current programme status on the source page.",
        ],
      });
    }
  }

  return leads;
}

export type FundingDiscoveryRunResult =
  | {
      ok: true;
      leads: FundingDiscoveryLead[];
      overallCaveats: string[];
      queriesUsed: string[];
      model: string;
      logId: string;
      /** Top search hits also had public pages fetched for extra context. */
      pageEnrichmentCount: number;
    }
  | { ok: false; error: string };

/**
 * Web search (Tavily) + optional page fetch + Mitchell: draft opportunities from the public web.
 * @param options.briefId When set, must belong to the current user; updates `last_run_at` on success.
 */
export async function runFundingDiscovery(
  userBriefRaw: string,
  options?: { briefId?: string | null },
): Promise<FundingDiscoveryRunResult> {
  try {
    if (!isTavilyConfigured()) {
      return {
        ok: false,
        error:
          "Web search is not configured. Set TAVILY_API_KEY in the server environment (see DEPLOYMENT.md).",
      };
    }

    const briefParsed = userBriefSchema.safeParse(userBriefRaw);
    if (!briefParsed.success) {
      return {
        ok: false,
        error: briefParsed.error.issues[0]?.message ?? "Invalid brief.",
      };
    }
    const userBrief = briefParsed.data;

    const { email } = await getSessionUserEmailOrRedirect();
    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }

    const db = getServerDb();
    if (options?.briefId) {
      if (!z.string().uuid().safeParse(options.briefId).success) {
        return { ok: false, error: "Invalid saved brief id." };
      }
      const [owned] = await db
        .select({ id: fundingDiscoveryBriefs.id })
        .from(fundingDiscoveryBriefs)
        .where(
          and(
            eq(fundingDiscoveryBriefs.id, options.briefId),
            eq(fundingDiscoveryBriefs.userId, userId),
          ),
        )
        .limit(1);
      if (!owned) {
        return { ok: false, error: "Saved brief not found." };
      }
    }

    const ctx = await tryCreateFundingOpsAiContext({
      userId,
      opportunityId: null,
    });
    if (!ctx) {
      return {
        ok: false,
        error:
          "AI is not configured. Add your key under Settings → BYOK & AI keys, or set AI_API_KEY / OPENAI_API_KEY on the server.",
      };
    }

    let queriesUsed: string[];
    try {
      const expanded = await runFundingSearchQueryExpansion(ctx, { userBrief });
      queriesUsed = expanded.value.queries;
    } catch (e) {
      if (e instanceof AiParseError) {
        console.warn(
          "[funding-discovery] Query expansion parse failed; using fallback queries.",
          e.message,
        );
        queriesUsed = buildFallbackFundingQueries(userBrief);
      } else {
        throw e;
      }
    }

    const batchResults = await Promise.all(
      queriesUsed.map(async (q) => {
        try {
          return await searchTavily(q);
        } catch (e) {
          console.warn("[funding-discovery] Tavily query failed:", q, e);
          return [];
        }
      }),
    );

    const merged = mergeTavilyResults(batchResults).slice(0, 18);
    if (merged.length === 0) {
      return {
        ok: false,
        error:
          "No search results returned. Try different wording, or check Tavily status and API key limits.",
      };
    }

    const enriched = await enrichTavilyResultsWithFetchedPages(merged);
    const pageEnrichmentCount = Math.min(6, merged.length);
    const forModel = enriched.slice(0, 12);

    let generatedLeads: FundingDiscoveryLead[];
    let overallCaveats: string[];
    let model = ctx.model;
    let logId = "fallback-no-log";
    try {
      const gen = await runMitchellFundingDiscovery(ctx, {
        userBrief,
        searchResults: forModel,
      });
      generatedLeads = gen.value.leads;
      overallCaveats = gen.value.overallCaveats;
      model = gen.model;
      logId = gen.logId;
    } catch (e) {
      if (e instanceof AiParseError) {
        console.warn(
          "[funding-discovery] Mitchell structured parse failed; using fallback lead extraction.",
          e.message,
        );
        generatedLeads = buildFallbackLeadsFromSearchResults(forModel);
        overallCaveats = [
          "Structured AI extraction failed for this run; showing deterministic fallback leads from search results.",
        ];
      } else {
        throw e;
      }
    }

    if (generatedLeads.length === 0) {
      return {
        ok: false,
        error:
          "Search returned pages, but Mitchell could not map them to programmes with matching official URLs. Try different wording or run again.",
      };
    }

    if (options?.briefId) {
      const now = new Date();
      await db
        .update(fundingDiscoveryBriefs)
        .set({ lastRunAt: now, updatedAt: now })
        .where(
          and(
            eq(fundingDiscoveryBriefs.id, options.briefId),
            eq(fundingDiscoveryBriefs.userId, userId),
          ),
        );
      revalidatePath("/opportunities/discover");
    }

    return {
      ok: true,
      leads: generatedLeads,
      overallCaveats,
      queriesUsed,
      model,
      logId,
      pageEnrichmentCount,
    };
  } catch (e) {
    return handleAiError(e);
  }
}

const importLeadsSchema = z.array(fundingDiscoveryLeadSchema).min(1).max(15);

export type FundingDiscoveryImportResult =
  | { ok: true; importedIds: string[]; skippedDuplicates: number }
  | { ok: false; error: string };

/**
 * Insert selected leads as draft opportunities (current user as owner).
 */
export async function importFundingDiscoveryLeads(
  leadsRaw: unknown,
): Promise<FundingDiscoveryImportResult> {
  try {
    const parsed = importLeadsSchema.safeParse(leadsRaw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid leads payload.",
      };
    }
    const leads = parsed.data;

    const { email } = await getSessionUserEmailOrRedirect();
    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }

    const db = getServerDb();
    const existing = await db
      .select({ grantUrl: opportunities.grantUrl })
      .from(opportunities)
      .where(eq(opportunities.ownerUserId, userId));

    const existingNorm = new Set(
      existing
        .map((r) => r.grantUrl)
        .filter((u): u is string => typeof u === "string" && u.length > 0)
        .map((u) => normalizeResultUrl(u)),
    );

    const importedIds: string[] = [];
    let skippedDuplicates = 0;

    for (const lead of leads) {
      const url = normalizeResultUrl(lead.grantUrl);
      if (existingNorm.has(url)) {
        skippedDuplicates += 1;
        continue;
      }
      existingNorm.add(url);

      const internalNotes = [
        "Imported via Mitchell funding discovery.",
        `Model confidence: ${lead.confidence}.`,
        lead.tags.length ? `Tags: ${lead.tags.join(", ")}.` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const [row] = await db
        .insert(opportunities)
        .values({
          title: lead.title.slice(0, 4000),
          summary: lead.summary,
          funderName: lead.funderName ? lead.funderName.slice(0, 255) : null,
          grantUrl: url,
          closesAt: parseClosesAt(lead.closesAtIso),
          status: "draft",
          ownerUserId: userId,
          eligibilityNotes: lead.eligibilityNotes?.trim()
            ? lead.eligibilityNotes.trim().slice(0, 8000)
            : null,
          internalNotes: internalNotes.slice(0, 8000),
          currencyCode: "GBP",
          updatedAt: new Date(),
        })
        .returning({ id: opportunities.id });

      if (row) importedIds.push(row.id);
    }

    revalidatePath("/opportunities");
    for (const id of importedIds) {
      revalidatePath(`/opportunities/${id}`);
    }

    return { ok: true, importedIds, skippedDuplicates };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Import failed.",
    };
  }
}

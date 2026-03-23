import Link from "next/link";
import { notFound } from "next/navigation";

import { opportunityScores } from "@/db/schema/tables";
import { formatDate, formatMoney } from "@/lib/format";
import { OPPORTUNITY_STATUS_LABEL } from "@/lib/opportunities/constants";
import {
  averageFit,
  recommendFromScores,
  scoreRowToInput,
  weightedOverall,
} from "@/lib/opportunities/scoring-engine";

import { loadOpportunityDetail } from "../actions";
import { DeleteOpportunityButton } from "../delete-opportunity-button";
import {
  ConflictQuickForm,
  DeleteEntityButton,
  GithubRepoQuickLinkForm,
  KnowledgeLinkForm,
  KnowledgeQuickCreateForm,
  PackQuickForm,
  type ScoreFormInitial,
  ScoreInlineForm,
  TaskQuickForm,
} from "../opportunity-detail-forms";
import { MarkdownPreview } from "@/app/(app)/collateral/markdown-preview";
import { MitchellAvatar } from "@/components/mitchell-avatar";
import { ScoreTriageCard } from "../score-triage-card";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildScoreFormInitial(
  score: typeof opportunityScores.$inferSelect | null,
): ScoreFormInitial {
  if (!score) {
    return {
      eligibilityFit: null,
      restormelFit: null,
      sophiaFit: null,
      cashValue: null,
      burnReductionValue: null,
      effortRequired: null,
      strategicValue: null,
      timeSensitivity: null,
      rationale: null,
    };
  }
  return {
    eligibilityFit: num(score.eligibilityFit),
    restormelFit: num(score.restormelFit),
    sophiaFit: num(score.sophiaFit),
    cashValue: num(score.cashValue),
    burnReductionValue: num(score.burnReductionValue),
    effortRequired: num(score.effortRequired),
    strategicValue: num(score.strategicValue),
    timeSensitivity: num(score.timeSensitivity),
    rationale: score.rationale,
  };
}

export const dynamic = "force-dynamic";

const sectionClass =
  "scroll-mt-8 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5";
const sectionTitle = "text-lg font-medium text-zinc-100";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadOpportunityDetail(id);
  if (!data) notFound();

  const o = data.opportunity;
  const score = data.score;
  const scoringInput = scoreRowToInput(score);
  const overall = weightedOverall(scoringInput);
  const compositeFit = averageFit(scoringInput);
  const recommendation = recommendFromScores({
    overall,
    scoring: scoringInput,
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Opportunity
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {o.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-400">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
              {OPPORTUNITY_STATUS_LABEL[o.status]}
            </span>
            {o.funderName ? <span>{o.funderName}</span> : null}
            {o.closesAt ? (
              <span>Closes {formatDate(o.closesAt)}</span>
            ) : (
              <span>No deadline set</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/opportunities/${id}/edit`}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
          >
            Edit
          </Link>
          <Link
            href="/opportunities"
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← All opportunities
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3 text-sm">
        {(
          [
            ["#overview", "Overview"],
            ["#mitchell", "Mitchell"],
            ["#eligibility", "Eligibility"],
            ["#notes", "Notes"],
            ["#scoring", "Scoring"],
            ["#packs", "Submission packs"],
            ["#knowledge", "Knowledge"],
            ["#tasks", "Tasks"],
            ["#conflicts", "Conflicts"],
          ] as const
        ).map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-md px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="overview" className={sectionClass}>
        <h2 className={sectionTitle}>Overview</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Owner</dt>
            <dd className="text-zinc-200">
              {data.ownerName?.trim() || data.ownerEmail || "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Estimated value</dt>
            <dd className="text-zinc-200">
              {formatMoney(o.estimatedValue, o.currencyCode ?? "GBP")}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Grant / fund URL</dt>
            <dd className="text-zinc-200">
              {o.grantUrl?.trim() ? (
                <a
                  href={o.grantUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:text-sky-300 hover:underline"
                >
                  {o.grantUrl}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Summary</dt>
            <dd className="whitespace-pre-wrap text-zinc-300">
              {o.summary?.trim() ? o.summary : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section id="mitchell" className={sectionClass}>
        <div className="flex flex-wrap items-center gap-3">
          <MitchellAvatar size={44} />
          <h2 className={sectionTitle}>Mitchell</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Grant intake lead — fetches the call page, fills what we can, scores the
          opportunity, and tells you straight what he still needs. Re-run from{" "}
          <Link href={`/opportunities/${id}/edit`} className="text-sky-400 hover:underline">
            Edit
          </Link>{" "}
          if the URL or context changes.
        </p>
        {o.mitchellBriefMd?.trim() ? (
          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-200">
            <MarkdownPreview markdown={o.mitchellBriefMd} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No brief yet — add a grant URL and run Mitchell intake from Edit (or create
            the opportunity with a URL to run intake automatically).
          </p>
        )}
      </section>

      <section id="knowledge" className={sectionClass}>
        <h2 className={sectionTitle}>Knowledge links</h2>
        {data.knowledge.length === 0 ? (
          <p className="text-sm text-zinc-500">No linked materials yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.knowledge.map((k) => (
              <li
                key={k.knowledgeAssetId}
                className="flex items-start justify-between gap-3 rounded-md border border-zinc-800 p-3 text-sm"
              >
                <div>
                  <a
                    href={k.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    {k.title}
                  </a>
                  <p className="text-xs text-zinc-500">
                    {k.sourceType} · priority {k.priority}
                  </p>
                  {k.relevanceNote ? (
                    <p className="mt-1 whitespace-pre-wrap text-zinc-400">
                      {k.relevanceNote}
                    </p>
                  ) : null}
                </div>
                <DeleteEntityButton
                  kind="knowledge"
                  id={k.knowledgeAssetId}
                  opportunityId={id}
                />
              </li>
            ))}
          </ul>
        )}
        <GithubRepoQuickLinkForm opportunityId={id} />
        <KnowledgeLinkForm opportunityId={id} options={data.availableKnowledge} />
        <KnowledgeQuickCreateForm opportunityId={id} />
      </section>

      <section id="eligibility" className={sectionClass}>
        <h2 className={sectionTitle}>Eligibility</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {o.eligibilityNotes?.trim() ? o.eligibilityNotes : "No eligibility notes yet. Add them when editing the opportunity."}
        </p>
        <div className="mt-6 border-t border-zinc-800 pt-4">
          <h3 className="text-sm font-medium text-zinc-200">
            Product fit assessment
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
            {o.productFitAssessmentMd?.trim()
              ? o.productFitAssessmentMd
              : "No AI product-weighting assessment yet. Add a grant URL on the edit page and run “Pull details from grant URL”."}
          </p>
        </div>
      </section>

      <section id="notes" className={sectionClass}>
        <h2 className={sectionTitle}>Internal notes</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {o.internalNotes?.trim() ? o.internalNotes : "—"}
        </p>
      </section>

      <section id="scoring" className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className={sectionTitle}>Scoring & triage</h2>
          <Link
            href={`/opportunities/${id}/edit#scoring`}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700"
          >
            AI triage on edit
          </Link>
        </div>
        <div className="mb-6">
          <ScoreTriageCard
            overall={overall}
            compositeFit={compositeFit}
            timeSensitivity={scoringInput.timeSensitivity ?? null}
            recommendation={recommendation}
            closesAt={o.closesAt}
          />
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          One score row per opportunity. Dimensions you leave blank are excluded;
          weights renormalise across the rest.
        </p>
        <ScoreInlineForm
          opportunityId={id}
          initial={buildScoreFormInitial(score)}
        />
      </section>

      <section id="packs" className={sectionClass}>
        <h2 className={sectionTitle}>Submission packs</h2>
        {data.packs.length === 0 ? (
          <p className="text-sm text-zinc-500">No packs yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md">
            {data.packs.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
              >
                <div>
                  <Link
                    href={`/submission-packs/${p.id}`}
                    className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {p.status.replace("_", " ")} · updated{" "}
                    {formatDate(p.updatedAt)}
                  </p>
                </div>
                <DeleteEntityButton
                  kind="pack"
                  id={p.id}
                  opportunityId={id}
                />
              </li>
            ))}
          </ul>
        )}
        <PackQuickForm opportunityId={id} />
      </section>

      <section id="tasks" className={sectionClass}>
        <h2 className={sectionTitle}>Tasks</h2>
        {data.taskList.length === 0 ? (
          <p className="text-sm text-zinc-500">No tasks for this opportunity.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md">
            {data.taskList.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-200">{t.title}</p>
                  <p className="text-xs text-zinc-500">
                    {t.status.replace("_", " ")}
                    {t.dueAt ? ` · due ${formatDate(t.dueAt)}` : ""}
                  </p>
                </div>
                <DeleteEntityButton
                  kind="task"
                  id={t.id}
                  opportunityId={id}
                />
              </li>
            ))}
          </ul>
        )}
        <TaskQuickForm opportunityId={id} />
      </section>

      <section id="conflicts" className={sectionClass}>
        <h2 className={sectionTitle}>Application conflicts</h2>
        {data.conflicts.length === 0 ? (
          <p className="text-sm text-zinc-500">No logged conflicts.</p>
        ) : (
          <ul className="space-y-3">
            {data.conflicts.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-md border border-zinc-800 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-200">{c.title}</p>
                  <p className="text-xs text-zinc-500">
                    {c.severity}
                    {c.resolvedAt ? ` · resolved ${formatDate(c.resolvedAt)}` : ""}
                  </p>
                  {c.detail ? (
                    <p className="mt-1 whitespace-pre-wrap text-zinc-400">
                      {c.detail}
                    </p>
                  ) : null}
                </div>
                <DeleteEntityButton
                  kind="conflict"
                  id={c.id}
                  opportunityId={id}
                />
              </li>
            ))}
          </ul>
        )}
        <ConflictQuickForm opportunityId={id} />
      </section>

      <section className="rounded-lg border border-red-900/40 bg-red-950/20 p-5">
        <h2 className="text-sm font-medium text-red-200">Danger zone</h2>
        <p className="mt-1 text-sm text-red-200/70">
          Permanently delete this opportunity and related packs/scores.
        </p>
        <div className="mt-3">
          <DeleteOpportunityButton id={id} />
        </div>
      </section>
    </div>
  );
}

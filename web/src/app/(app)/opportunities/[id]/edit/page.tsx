import Link from "next/link";
import { notFound } from "next/navigation";

import { opportunityScores } from "@/db/schema/tables";
import {
  averageFit,
  recommendFromScores,
  scoreRowToInput,
  weightedOverall,
} from "@/lib/opportunities/scoring-engine";

import { loadOpportunityDetail, loadUserOptions } from "../../actions";
import {
  DeleteEntityButton,
  GithubRepoQuickLinkForm,
  KnowledgeLinkForm,
  KnowledgeQuickCreateForm,
  ScoreInlineForm,
  type ScoreFormInitial,
} from "../../opportunity-detail-forms";
import { OpportunityFormClient } from "../../opportunity-form-client";
import {
  OpportunityEditAiScoringButton,
  OpportunityEditGrantEnrichButton,
} from "../../opportunity-edit-ai-client";
import { ScoreTriageCard } from "../../score-triage-card";

export const dynamic = "force-dynamic";

const sectionClass =
  "scroll-mt-8 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5";
const sectionTitle = "text-lg font-medium text-zinc-100";

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

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadOpportunityDetail(id);
  if (!detail) notFound();

  const userOptions = await loadUserOptions();
  const o = detail.opportunity;
  const score = detail.score;
  const scoringInput = scoreRowToInput(score);
  const overall = weightedOverall(scoringInput);
  const compositeFit = averageFit(scoringInput);
  const recommendation = recommendFromScores({
    overall,
    scoring: scoringInput,
  });

  const linkedIds = new Set(
    detail.knowledge.map((k) => k.knowledgeAssetId),
  );
  const knowledgeOptions = detail.availableKnowledge.filter(
    (k) => !linkedIds.has(k.id),
  );

  const writerPack = detail.packs[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Edit opportunity
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{o.title}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/opportunities/${id}`}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
          >
            View detail
          </Link>
          <Link
            href="/opportunities"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← All opportunities
          </Link>
        </div>
      </div>

      <OpportunityFormClient
        opportunityId={id}
        userOptions={userOptions}
        submitLabel="Save changes"
        defaultValues={{
          title: o.title,
          summary: o.summary ?? "",
          funderName: o.funderName ?? "",
          closesAt: o.closesAt,
          status: o.status,
          ownerUserId: o.ownerUserId ?? "",
          eligibilityNotes: o.eligibilityNotes ?? "",
          internalNotes: o.internalNotes ?? "",
          estimatedValue:
            o.estimatedValue != null ? String(o.estimatedValue) : "",
          currencyCode: o.currencyCode ?? "GBP",
          grantUrl: o.grantUrl ?? "",
          productFitAssessmentMd: o.productFitAssessmentMd ?? "",
        }}
      />

      <section className={sectionClass}>
        <h2 className={sectionTitle}>Grant URL enrichment</h2>
        <p className="text-sm text-zinc-500">
          Fetches the page and uses AI to fill summary, eligibility, deadlines,
          value, and product-weighted fit (requires a saved grant URL above).
        </p>
        <OpportunityEditGrantEnrichButton opportunityId={id} />
      </section>

      <section className={sectionClass} id="knowledge">
        <h2 className={sectionTitle}>Knowledge links</h2>
        {detail.knowledge.length === 0 ? (
          <p className="text-sm text-zinc-500">No linked materials yet.</p>
        ) : (
          <ul className="space-y-2">
            {detail.knowledge.map((k) => (
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
        <KnowledgeLinkForm opportunityId={id} options={knowledgeOptions} />
        <KnowledgeQuickCreateForm opportunityId={id} />
      </section>

      <section className={sectionClass} id="scoring">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className={sectionTitle}>Scoring &amp; triage</h2>
          <OpportunityEditAiScoringButton opportunityId={id} />
        </div>
        <p className="text-sm text-zinc-500">
          AI fills all dimensions (1–5) plus rationale; overall score is still derived
          from weights on the detail view.{" "}
          <Link href={`/opportunities/${id}#scoring`} className="text-sky-400 hover:underline">
            Open scoring on detail
          </Link>
        </p>
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

      <section className={sectionClass} id="writing">
        <h2 className={sectionTitle}>AI writing workspace</h2>
        <p className="text-sm text-zinc-500">
          Submission packs host the long-form writer, checklist, and export. Open an
          existing pack or create one from the opportunity detail page.
        </p>
        {writerPack ? (
          <Link
            href={`/submission-packs/${writerPack.id}`}
            className="inline-flex rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Open “{writerPack.title}”
          </Link>
        ) : (
          <p className="text-sm text-zinc-500">
            No submission pack yet.{" "}
            <Link
              href={`/opportunities/${id}#packs`}
              className="text-sky-400 hover:underline"
            >
              Create a pack on the detail page
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}

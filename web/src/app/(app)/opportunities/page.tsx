import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { formatDateOnly, formatMoney } from "@/lib/format";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABEL,
} from "@/lib/opportunities/constants";
import {
  RECOMMENDED_ACTION_LABEL,
  type RecommendedAction,
} from "@/lib/opportunities/scoring-engine";

import { DeleteOpportunityButton } from "./delete-opportunity-button";
import { loadOpportunitiesList } from "./actions";

export const dynamic = "force-dynamic";

const recBadge: Record<RecommendedAction, string> = {
  apply_now: "bg-emerald-900/50 text-emerald-200",
  prepare: "bg-sky-900/50 text-sky-200",
  monitor: "bg-amber-900/40 text-amber-200",
  ignore: "bg-zinc-800 text-zinc-400",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q;
  const status = sp.status;
  const sort = sp.sort ?? "pipeline";
  const rows = await loadOpportunitiesList({ q, status, sort });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Opportunities
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Default sort is triage pipeline (weighted score, then recommendation,
            then deadline). Filter by status or search.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/opportunities/discover"
            className="inline-flex items-center justify-center rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            Discover funding
          </Link>
          <Link
            href="/opportunities/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            New opportunity
          </Link>
        </div>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        method="get"
      >
        <div className="min-w-[200px] flex-1">
          <label
            className="mb-1 block text-xs font-medium text-zinc-500"
            htmlFor="q"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Title, funder, summary…"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="w-full min-w-[160px] sm:w-44">
          <label
            className="mb-1 block text-xs font-medium text-zinc-500"
            htmlFor="status"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? "all"}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="all">All statuses</option>
            {OPPORTUNITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {OPPORTUNITY_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full min-w-[180px] sm:w-52">
          <label
            className="mb-1 block text-xs font-medium text-zinc-500"
            htmlFor="sort"
          >
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="pipeline">Triage pipeline</option>
            <option value="deadline">Deadline (soonest)</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            Apply
          </button>
          <Link
            href="/opportunities"
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Reset filters
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Funder</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Fit</th>
              <th className="px-4 py-3 font-medium">Triage</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4">
                  <EmptyState
                    title={
                      q || (status && status !== "all")
                        ? "No opportunities match these filters"
                        : "No opportunities yet"
                    }
                    description={
                      q || (status && status !== "all")
                        ? "Try resetting filters or broadening your search."
                        : "Create your first call or programme to start the pipeline."
                    }
                  >
                    <Link
                      href="/opportunities/new"
                      className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
                    >
                      New opportunity
                    </Link>
                    {q || (status && status !== "all") ? (
                      <Link
                        href="/opportunities"
                        className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        Reset filters
                      </Link>
                    ) : null}
                  </EmptyState>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-800/80 hover:bg-zinc-900/30"
                >
                  <td className="max-w-xs px-4 py-3 font-medium text-zinc-100">
                    <Link
                      href={`/opportunities/${r.id}`}
                      className="hover:underline"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {r.funderName || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs">
                      {OPPORTUNITY_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {formatDateOnly(r.closesAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">
                    {r.overall != null ? `${r.overall}` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-400">
                    {r.compositeFit != null
                      ? r.compositeFit.toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${recBadge[r.recommendation]}`}
                    >
                      {RECOMMENDED_ACTION_LABEL[r.recommendation]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {formatMoney(r.estimatedValue, r.currencyCode ?? "GBP")}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {r.ownerName?.trim() || r.ownerEmail || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/opportunities/${r.id}/edit`}
                      className="mr-3 text-zinc-400 hover:text-zinc-200"
                    >
                      Edit
                    </Link>
                    <DeleteOpportunityButton id={r.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

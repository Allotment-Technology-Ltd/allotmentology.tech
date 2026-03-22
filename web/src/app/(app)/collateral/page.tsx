import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import {
  COLLATERAL_KINDS,
  COLLATERAL_KIND_LABEL,
} from "@/lib/collateral/constants";

import { loadCollateralList } from "./actions";

export const dynamic = "force-dynamic";

export default async function CollateralListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; approved?: string }>;
}) {
  const sp = await searchParams;
  const rows = await loadCollateralList({
    q: sp.q,
    kind: sp.kind,
    approved: sp.approved,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Collateral library
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Reusable Markdown blocks — bios, programme-specific summaries, and
            standard answers. Approved items are your trusted store for packs.
          </p>
        </div>
        <Link
          href="/collateral/new"
          className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          New collateral
        </Link>
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
            defaultValue={sp.q}
            placeholder="Title or body…"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div className="w-full min-w-[200px] sm:w-56">
          <label
            className="mb-1 block text-xs font-medium text-zinc-500"
            htmlFor="kind"
          >
            Type
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={sp.kind ?? "all"}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="all">All types</option>
            {COLLATERAL_KINDS.map((k) => (
              <option key={k} value={k}>
                {COLLATERAL_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full min-w-[160px] sm:w-44">
          <label
            className="mb-1 block text-xs font-medium text-zinc-500"
            htmlFor="approved"
          >
            Approval
          </label>
          <select
            id="approved"
            name="approved"
            defaultValue={sp.approved ?? "all"}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="all">All</option>
            <option value="approved">Approved only</option>
            <option value="draft">Not approved</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
          >
            Apply
          </button>
          <Link
            href="/collateral"
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Approval</th>
              <th className="px-4 py-3 font-medium">Packs</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <EmptyState
                    title={
                      sp.q ||
                      (sp.kind && sp.kind !== "all") ||
                      (sp.approved && sp.approved !== "all")
                        ? "No collateral matches"
                        : "Collateral library is empty"
                    }
                    description="Approved blocks are safest to paste into submission packs. Drafts stay editable until you mark approval."
                  >
                    <Link
                      href="/collateral/new"
                      className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
                    >
                      New collateral
                    </Link>
                    {sp.q ||
                    (sp.kind && sp.kind !== "all") ||
                    (sp.approved && sp.approved !== "all") ? (
                      <Link
                        href="/collateral"
                        className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        Reset filters
                      </Link>
                    ) : null}
                  </EmptyState>
                </td>
              </tr>
            ) : (
              rows.map(({ item, authorName, authorEmail, packRefCount }) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-800/80 hover:bg-zinc-900/30"
                >
                  <td className="max-w-xs px-4 py-3">
                    <Link
                      href={`/collateral/${item.id}`}
                      className="font-medium text-zinc-100 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {authorName?.trim() || authorEmail || "Unknown author"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {COLLATERAL_KIND_LABEL[item.kind]}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">
                    v{item.version}
                  </td>
                  <td className="px-4 py-3">
                    {item.approved ? (
                      <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-300">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">
                    {packRefCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                    {formatDate(item.updatedAt)}
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

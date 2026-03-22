import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PACK_STATUS_LABEL } from "@/lib/opportunities/constants";
import { formatDate } from "@/lib/format";

import { loadSubmissionPacksIndex } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const rows = await loadSubmissionPacksIndex();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Submission packs
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Copy-paste-ready application packs tied to opportunities. Open a pack to edit fields,
          manage the checklist, and export Markdown.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No submission packs yet"
          description="Create a pack from an opportunity’s detail page (Submission packs). Then open it here to edit narrative fields, checklist, and export Markdown."
        >
          <Link
            href="/opportunities"
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Go to opportunities
          </Link>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800">
          {rows.map(({ pack, opportunityTitle, funderName }) => (
            <li
              key={pack.id}
              className="flex flex-col gap-2 bg-zinc-950/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/submission-packs/${pack.id}`}
                  className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                >
                  {pack.title}
                </Link>
                <p className="mt-0.5 truncate text-sm text-zinc-400">
                  {opportunityTitle}
                  {funderName ? ` · ${funderName}` : ""}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Updated {formatDate(pack.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
                  {PACK_STATUS_LABEL[pack.status]}
                </span>
                <Link
                  href={`/opportunities/${pack.opportunityId}#packs`}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Opportunity
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

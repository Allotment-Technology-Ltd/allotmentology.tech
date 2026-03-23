import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate } from "@/lib/format";
import { COLLATERAL_KIND_LABEL } from "@/lib/collateral/constants";
import {
  PACK_STATUS_LABEL,
  type PackStatus,
} from "@/lib/opportunities/constants";

function packStatusLabel(status: string): string {
  return PACK_STATUS_LABEL[status as PackStatus] ?? status;
}

import {
  linkPackToCollateral,
  loadCollateralDetail,
  loadPackOptionsForCollateralLink,
  unlinkPackFromCollateral,
} from "../actions";
import { DeleteCollateralButton } from "../delete-collateral-button";
import { MarkdownPreview } from "../markdown-preview";

export const dynamic = "force-dynamic";

export default async function CollateralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadCollateralDetail(id);
  if (!data) notFound();

  const item = data.item;
  const packOptions = await loadPackOptionsForCollateralLink();
  const linkedIds = new Set(data.packLinks.map((p) => p.packId));
  const addablePacks = packOptions.filter((p) => !linkedIds.has(p.packId));

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Collateral
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {item.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-400">
            <span>{COLLATERAL_KIND_LABEL[item.kind]}</span>
            <span className="text-zinc-600">·</span>
            <span className="tabular-nums">v{item.version}</span>
            <span className="text-zinc-600">·</span>
            {item.approved ? (
              <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-300">
                Approved
              </span>
            ) : (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                Not approved
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Updated {formatDate(item.updatedAt)}
            {data.authorName || data.authorEmail
              ? ` · ${data.authorName?.trim() || data.authorEmail}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/collateral/${id}/edit#collateral-writing-aid`}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
          >
            Edit
          </Link>
          <Link
            href="/collateral"
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← Library
          </Link>
          <DeleteCollateralButton id={id} />
        </div>
      </div>

      {item.tags && item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          AI writing aid
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          The reader is below. To run Improve, Expand, or Shorten on this Markdown,
          open the editor — drafts apply to the body field; save when you are happy.
        </p>
        <p className="mt-2">
          <Link
            href={`/collateral/${id}/edit#collateral-writing-aid`}
            className="text-sm text-sky-400 hover:text-sky-300 hover:underline"
          >
            Open editor with AI controls
          </Link>
        </p>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Preview
        </h2>
        <div className="mt-3 border-t border-zinc-800/80 pt-4">
          <MarkdownPreview markdown={item.body} />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">
          Submission pack references
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Link packs that reuse this block. Opens the opportunity detail for
          context.
        </p>

        {data.packLinks.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No linked packs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-800 border border-zinc-800 rounded-md">
            {data.packLinks.map((p) => (
              <li
                key={p.packId}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div>
                  <Link
                    href={`/opportunities/${p.opportunityId}`}
                    className="font-medium text-zinc-200 hover:underline"
                  >
                    {p.opportunityTitle}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {p.packTitle} · {packStatusLabel(p.packStatus)}
                  </p>
                </div>
                <form action={unlinkPackFromCollateral}>
                  <input type="hidden" name="collateralId" value={id} />
                  <input type="hidden" name="submissionPackId" value={p.packId} />
                  <button
                    type="submit"
                    className="text-xs text-red-400/90 hover:text-red-300"
                  >
                    Unlink
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {addablePacks.length > 0 ? (
          <form action={linkPackToCollateral} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="collateralId" value={id} />
            <select
              name="submissionPackId"
              required
              className="min-w-[240px] flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Link a pack…</option>
              {addablePacks.map((p) => (
                <option key={p.packId} value={p.packId}>
                  {p.opportunityTitle} — {p.packTitle}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
            >
              Link pack
            </button>
          </form>
        ) : (
          <p className="mt-3 text-xs text-zinc-600">
            {packOptions.length === 0
              ? "Create submission packs from opportunities to link them here."
              : "All existing packs are already linked."}
          </p>
        )}
      </section>
    </div>
  );
}

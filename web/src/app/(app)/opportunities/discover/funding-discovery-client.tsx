"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { MitchellAvatar } from "@/components/mitchell-avatar";
import type { FundingDiscoveryLead } from "@/lib/ai/skills/mitchell-funding-discovery";

import {
  deleteFundingDiscoveryBrief,
  saveFundingDiscoveryBrief,
  type SavedFundingBriefListItem,
} from "../funding-discovery-briefs-actions";
import {
  importFundingDiscoveryLeads,
  runFundingDiscovery,
  type FundingDiscoveryRunResult,
} from "../funding-discovery-actions";

const labelClass = "mb-1 block text-sm font-medium text-zinc-300";
const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const btn =
  "inline-flex items-center justify-center rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50";
const primaryBtn =
  "inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50";
const dangerBtn =
  "inline-flex items-center justify-center rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200 hover:bg-red-950/60 disabled:opacity-50";

export function FundingDiscoveryClient(props: {
  tavilyConfigured: boolean;
  /** Non-null when the server could not read saved briefs (e.g. missing migration). */
  briefsLoadError: string | null;
  savedBriefs: SavedFundingBriefListItem[];
  initialBrief: { id: string; label: string; briefText: string } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [importPending, startImport] = useTransition();
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const [brief, setBrief] = useState(props.initialBrief?.briefText ?? "");
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(
    props.initialBrief?.id ?? null,
  );
  const [saveLabel, setSaveLabel] = useState(props.initialBrief?.label ?? "");
  const [run, setRun] = useState<FundingDiscoveryRunResult | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [briefFeedback, setBriefFeedback] = useState<string | null>(null);

  const leads = useMemo(
    () => (run && run.ok ? run.leads : ([] as FundingDiscoveryLead[])),
    [run],
  );

  const toggle = useCallback((i: number) => {
    setSelected((s) => ({ ...s, [i]: !s[i] }));
  }, []);

  const selectAll = useCallback(() => {
    const next: Record<number, boolean> = {};
    leads.forEach((_, i) => {
      next[i] = true;
    });
    setSelected(next);
  }, [leads]);

  const onDiscover = () => {
    setImportMsg(null);
    setBriefFeedback(null);
    setRun(null);
    start(async () => {
      const r = await runFundingDiscovery(brief, {
        briefId: selectedBriefId ?? undefined,
      });
      setRun(r);
      if (r.ok && r.leads.length > 0) {
        const next: Record<number, boolean> = {};
        r.leads.forEach((_, i) => {
          next[i] = true;
        });
        setSelected(next);
      }
      if (r.ok) {
        router.refresh();
      }
    });
  };

  const onImport = () => {
    setImportMsg(null);
    const picked = leads.filter((_, i) => selected[i]);
    if (picked.length === 0) {
      setImportMsg("Select at least one lead to import.");
      return;
    }
    startImport(async () => {
      const r = await importFundingDiscoveryLeads(picked);
      if (!r.ok) {
        setImportMsg(r.error);
        return;
      }
      const parts: string[] = [];
      if (r.importedIds.length > 0) {
        parts.push(
          `Imported ${r.importedIds.length} draft opportunit${r.importedIds.length === 1 ? "y" : "ies"}.`,
        );
      } else {
        parts.push("No new drafts were imported.");
      }
      if (r.skippedDuplicates > 0) {
        parts.push(`Skipped ${r.skippedDuplicates} duplicate URL(s) already in your pipeline.`);
      }
      setImportMsg(parts.join(" "));
      if (r.importedIds.length > 0) {
        router.push("/opportunities?sort=updated");
      } else {
        router.refresh();
      }
    });
  };

  const onSaveBrief = () => {
    setBriefFeedback(null);
    startSave(async () => {
      const r = await saveFundingDiscoveryBrief({
        id: selectedBriefId ?? undefined,
        label: saveLabel.trim() || "Untitled brief",
        briefText: brief,
      });
      if (!r.ok) {
        setBriefFeedback(r.error);
        return;
      }
      setSelectedBriefId(r.id);
      setBriefFeedback("Brief saved.");
      router.replace(`/opportunities/discover?brief=${encodeURIComponent(r.id)}`);
      router.refresh();
    });
  };

  const onDeleteBrief = () => {
    if (!selectedBriefId) return;
    if (!window.confirm("Delete this saved brief? This cannot be undone.")) return;
    setBriefFeedback(null);
    startDelete(async () => {
      const r = await deleteFundingDiscoveryBrief(selectedBriefId);
      if (!r.ok) {
        setBriefFeedback(r.error);
        return;
      }
      setSelectedBriefId(null);
      setSaveLabel("");
      router.replace("/opportunities/discover");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {props.briefsLoadError ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-50">Saved briefs unavailable</p>
          <p className="mt-1 text-amber-100/90">{props.briefsLoadError}</p>
          <p className="mt-2 text-xs text-amber-200/80">
            You can still run Discover funding below. Production: ensure{" "}
            <code className="rounded bg-zinc-950 px-1">npm run db:migrate</code> (or{" "}
            <code className="rounded bg-zinc-950 px-1">vercel-build</code>) has applied migration{" "}
            <code className="rounded bg-zinc-950 px-1">0016_funding_discovery_briefs</code>.
          </p>
        </div>
      ) : null}

      {!props.tavilyConfigured ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-50">Web search is not configured</p>
          <p className="mt-1 text-amber-100/90">
            Set <code className="rounded bg-zinc-950 px-1">TAVILY_API_KEY</code> on the server
            (see <code className="rounded bg-zinc-950 px-1">DEPLOYMENT.md</code>) and redeploy. This
            key is separate from your AI model key.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start gap-4">
        <MitchellAvatar size={48} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-relaxed text-zinc-400">
            Describe your company, geography, and what you need (grants, cloud credits, marketing
            funds, etc.). Mitchell expands that into several web searches, fetches plain text from
            the top programme pages where possible, then structures results into draft opportunities.
            Saved briefs let you re-run the same search later (bookmark{" "}
            <code className="rounded bg-zinc-900 px-1 text-zinc-300">/opportunities/discover?brief=…</code>
            ). Automated schedules are not wired yet — use a recurring calendar reminder if you need
            a nudge to re-run.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
        <h2 className="text-base font-medium text-zinc-200">Saved briefs</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Select a saved brief to attach this run (updates last run time). Or leave ad-hoc with no
          selection.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[200px] flex-1">
            <label className={labelClass} htmlFor="fd-saved">
              Load
            </label>
            <select
              id="fd-saved"
              className={inputClass}
              value={selectedBriefId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                setSelectedBriefId(id);
                if (id) {
                  const b = props.savedBriefs.find((x) => x.id === id);
                  if (b) {
                    setBrief(b.briefText);
                    setSaveLabel(b.label);
                    router.replace(`/opportunities/discover?brief=${encodeURIComponent(id)}`);
                  }
                } else {
                  router.replace("/opportunities/discover");
                }
              }}
            >
              <option value="">— Ad-hoc (not linked to a saved brief) —</option>
              {props.savedBriefs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                  {b.lastRunAt
                    ? ` (last run ${new Date(b.lastRunAt).toLocaleDateString()})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className={labelClass} htmlFor="fd-label">
              Label for saving
            </label>
            <input
              id="fd-label"
              className={inputClass}
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              placeholder="e.g. UK SaaS + credits"
              maxLength={255}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryBtn}
              disabled={savePending || brief.trim().length < 20}
              onClick={onSaveBrief}
            >
              {savePending ? "Saving…" : selectedBriefId ? "Update saved brief" : "Save as new brief"}
            </button>
            {selectedBriefId ? (
              <button
                type="button"
                className={dangerBtn}
                disabled={deletePending}
                onClick={onDeleteBrief}
              >
                {deletePending ? "Deleting…" : "Delete brief"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="fd-brief">
          Funding brief
        </label>
        <textarea
          id="fd-brief"
          rows={6}
          className={inputClass}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. UK B2B SaaS, seed stage, looking for R&D grants, AWS/GCP credits, and any startup marketing or brand programmes open in 2025."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={primaryBtn} disabled={pending} onClick={onDiscover}>
          {pending ? "Searching…" : "Search & structure with Mitchell"}
        </button>
      </div>

      {briefFeedback ? (
        <p
          className={`text-sm ${briefFeedback.startsWith("Brief saved") ? "text-emerald-400/90" : "text-red-400"}`}
        >
          {briefFeedback}
        </p>
      ) : null}

      {run && !run.ok ? (
        <p className="text-sm text-red-400">{run.error}</p>
      ) : null}

      {run && run.ok ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-400">
            <p>
              <span className="text-zinc-500">Queries used: </span>
              {run.queriesUsed.join(" · ")}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Second pass: fetched public HTML for the top {run.pageEnrichmentCount} programme
              page(s) and appended excerpts for Mitchell (best-effort; some sites block bots).
            </p>
            {run.overallCaveats.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-zinc-500">
                {run.overallCaveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-zinc-600">Model: {run.model}</p>
          </div>

          {leads.length === 0 ? (
            <p className="text-sm text-zinc-500">No leads returned — try a different brief.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={btn} onClick={selectAll}>
                  Select all
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={importPending}
                  onClick={onImport}
                >
                  {importPending ? "Importing…" : "Import selected as drafts"}
                </button>
                {importMsg ? (
                  <span
                    className={`text-sm ${
                      importMsg.startsWith("Imported")
                        ? "text-emerald-400/90"
                        : importMsg.startsWith("No new drafts")
                          ? "text-amber-300"
                          : "text-red-400"
                    }`}
                  >
                    {importMsg}
                  </span>
                ) : null}
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Use</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Funder</th>
                      <th className="px-3 py-2">Tags</th>
                      <th className="px-3 py-2">Confidence</th>
                      <th className="px-3 py-2">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {leads.map((lead, i) => (
                      <tr key={`${lead.grantUrl}-${i}`} className="align-top">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected[i] ?? false}
                            onChange={() => toggle(i)}
                            className="rounded border-zinc-600"
                          />
                        </td>
                        <td className="px-3 py-2 text-zinc-200">{lead.title}</td>
                        <td className="px-3 py-2 text-zinc-400">{lead.funderName ?? "—"}</td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          {lead.tags.join(", ")}
                        </td>
                        <td className="px-3 py-2 text-zinc-500">{lead.confidence}</td>
                        <td className="px-3 py-2">
                          <a
                            href={lead.grantUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-zinc-600">
                Each row includes caveats in the structured data — open the programme link and
                confirm eligibility before shortlisting.
              </p>
            </>
          )}
        </div>
      ) : null}

      <p className="text-sm text-zinc-500">
        <Link href="/opportunities" className="text-sky-400 hover:text-sky-300 hover:underline">
          Back to opportunities
        </Link>
      </p>
    </div>
  );
}

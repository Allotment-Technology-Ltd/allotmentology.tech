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

type ProjectFocus = "restormel" | "sophia" | "both" | "other";
type CompanyStage = "idea" | "pre_seed" | "seed" | "growth" | "research";
type Geography = "uk" | "eu" | "us" | "global";
type FundingUrgency = "immediate" | "quarter" | "six_months" | "explore";

const NEED_OPTIONS = [
  { id: "cash_grants", label: "Cash grants" },
  { id: "cloud_credits", label: "Cloud / compute credits" },
  { id: "api_credits", label: "AI API credits" },
  { id: "rd_support", label: "R&D support or vouchers" },
  { id: "accelerators", label: "Accelerators / incubators" },
] as const;

function composeDiscoveryBrief(input: {
  projectFocus: ProjectFocus | "";
  projectName: string;
  repoUrl: string;
  companyStage: CompanyStage;
  geography: Geography;
  fundingUrgency: FundingUrgency;
  needs: string[];
  additionalContext: string;
}): string {
  const project =
    input.projectFocus === "restormel"
      ? "Restormel Keys"
      : input.projectFocus === "sophia"
        ? "SOPHIA"
        : input.projectFocus === "both"
          ? "Both Restormel Keys and SOPHIA"
          : input.projectName.trim() || "Other project";

  const stageMap: Record<CompanyStage, string> = {
    idea: "idea/MVP",
    pre_seed: "pre-seed",
    seed: "seed",
    growth: "growth",
    research: "research/prototype",
  };
  const geoMap: Record<Geography, string> = {
    uk: "United Kingdom",
    eu: "Europe",
    us: "United States",
    global: "Global",
  };
  const urgencyMap: Record<FundingUrgency, string> = {
    immediate: "Immediate (0-2 months)",
    quarter: "This quarter (2-4 months)",
    six_months: "Within 6 months",
    explore: "Exploratory / longlist",
  };
  const needs =
    input.needs.length > 0
      ? input.needs.join(", ")
      : "cash grants, credits, and relevant non-dilutive support";

  return [
    `Project focus: ${project}.`,
    input.repoUrl.trim() ? `Project repository URL: ${input.repoUrl.trim()}.` : null,
    `Company stage: ${stageMap[input.companyStage]}.`,
    `Target geography: ${geoMap[input.geography]}.`,
    `Funding urgency: ${urgencyMap[input.fundingUrgency]}.`,
    `Priority funding needs: ${needs}.`,
    "Task: find live funding programmes (grants, credits, accelerators, research schemes) aligned with this profile and provide high-signal programme pages.",
    input.additionalContext.trim()
      ? `Additional context: ${input.additionalContext.trim()}`
      : null,
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n");
}

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

  const [projectFocus, setProjectFocus] = useState<ProjectFocus | "">(
    props.initialBrief ? "both" : "",
  );
  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [companyStage, setCompanyStage] = useState<CompanyStage>("seed");
  const [geography, setGeography] = useState<Geography>("uk");
  const [fundingUrgency, setFundingUrgency] = useState<FundingUrgency>("quarter");
  const [needs, setNeeds] = useState<string[]>(["cash_grants", "cloud_credits"]);
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
  const composedBrief = useMemo(
    () =>
      composeDiscoveryBrief({
        projectFocus,
        projectName,
        repoUrl,
        companyStage,
        geography,
        fundingUrgency,
        needs,
        additionalContext: brief,
      }),
    [brief, companyStage, fundingUrgency, geography, needs, projectFocus, projectName, repoUrl],
  );
  const canRunDiscovery = projectFocus !== "";

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
    if (!canRunDiscovery) {
      setBriefFeedback("Select which project the funding is for.");
      return;
    }
    start(async () => {
      const r = await runFundingDiscovery(composedBrief, {
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
      if (r.skippedInvalid > 0) {
        parts.push(`Skipped ${r.skippedInvalid} item(s) due to invalid or incompatible source data.`);
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
    if (!canRunDiscovery) {
      setBriefFeedback("Select which project the funding is for.");
      return;
    }
    startSave(async () => {
      const r = await saveFundingDiscoveryBrief({
        id: selectedBriefId ?? undefined,
        label: saveLabel.trim() || "Untitled brief",
        briefText: composedBrief,
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
            Answer a short set of questions so discovery is more targeted. Mitchell expands this into
            focused searches, fetches plain text from top programme pages where possible, then
            structures results into draft opportunities. Saved briefs let you re-run the same search
            later (bookmark{" "}
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
                    setProjectFocus("both");
                    setBrief(b.briefText);
                    setSaveLabel(b.label);
                    router.replace(`/opportunities/discover?brief=${encodeURIComponent(id)}`);
                  }
                } else {
                  setProjectFocus("");
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
              disabled={savePending || !canRunDiscovery}
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

      <div className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="fd-project-focus">
            Which project is the funding for?
          </label>
          <select
            id="fd-project-focus"
            className={inputClass}
            value={projectFocus}
            onChange={(e) => setProjectFocus(e.target.value as ProjectFocus | "")}
          >
            <option value="">Select project…</option>
            <option value="restormel">Restormel Keys</option>
            <option value="sophia">SOPHIA</option>
            <option value="both">Both</option>
            <option value="other">Other</option>
          </select>
        </div>
        {projectFocus === "other" ? (
          <div>
            <label className={labelClass} htmlFor="fd-project-name">
              Project name
            </label>
            <input
              id="fd-project-name"
              className={inputClass}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. New operator tool"
            />
          </div>
        ) : null}
        <div>
          <label className={labelClass} htmlFor="fd-repo-url">
            Project repository URL (optional)
          </label>
          <input
            id="fd-repo-url"
            className={inputClass}
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/org/repo"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fd-stage">
            Company stage
          </label>
          <select
            id="fd-stage"
            className={inputClass}
            value={companyStage}
            onChange={(e) => setCompanyStage(e.target.value as CompanyStage)}
          >
            <option value="idea">Idea/MVP</option>
            <option value="pre_seed">Pre-seed</option>
            <option value="seed">Seed</option>
            <option value="growth">Growth</option>
            <option value="research">Research/prototype</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="fd-geo">
            Primary geography
          </label>
          <select
            id="fd-geo"
            className={inputClass}
            value={geography}
            onChange={(e) => setGeography(e.target.value as Geography)}
          >
            <option value="uk">UK</option>
            <option value="eu">EU</option>
            <option value="us">US</option>
            <option value="global">Global</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="fd-urgency">
            Funding timeline
          </label>
          <select
            id="fd-urgency"
            className={inputClass}
            value={fundingUrgency}
            onChange={(e) => setFundingUrgency(e.target.value as FundingUrgency)}
          >
            <option value="immediate">Immediate (0-2 months)</option>
            <option value="quarter">This quarter</option>
            <option value="six_months">Within 6 months</option>
            <option value="explore">Exploratory</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <p className={`${labelClass} mb-2`}>What do you need most? (pick 1-3)</p>
          <div className="flex flex-wrap gap-3">
            {NEED_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={needs.includes(opt.id)}
                  onChange={(e) => {
                    setNeeds((prev) =>
                      e.target.checked
                        ? [...prev, opt.id].slice(0, 3)
                        : prev.filter((x) => x !== opt.id),
                    );
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="fd-brief">
            Additional context (optional)
          </label>
          <textarea
            id="fd-brief"
            rows={4}
            className={inputClass}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Anything specific to include or exclude, e.g. preferred programmes, hard constraints, or known no-go areas."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryBtn}
          disabled={pending || !canRunDiscovery}
          onClick={onDiscover}
        >
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

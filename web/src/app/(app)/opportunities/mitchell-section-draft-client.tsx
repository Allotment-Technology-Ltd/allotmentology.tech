"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MarkdownPreview } from "@/app/(app)/collateral/markdown-preview";
import { MitchellAvatar } from "@/components/mitchell-avatar";

import { runMitchellSectionDraftForOpportunity } from "./opportunity-ai-actions";

const labelClass = "mb-1 block text-sm font-medium text-zinc-300";
const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const btn =
  "rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50";

export function MitchellSectionDraftPanel(props: {
  opportunityId: string;
  initialDraftMd: string | null;
  initialFollowupMd: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [sectionGoal, setSectionGoal] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [pastedContext, setPastedContext] = useState("");
  const [wordLimit, setWordLimit] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Add{" "}
        <strong className="text-zinc-400">Knowledge links</strong> (LinkedIn, CV, past
        applications) above, then describe the section you need. Mitchell writes a first
        draft with placeholders and tells you exactly what to bring back to fill them
        in.
      </p>

      <div>
        <label className={labelClass} htmlFor="mitchell-section-goal">
          What should Mitchell draft?
        </label>
        <textarea
          id="mitchell-section-goal"
          name="sectionGoal"
          rows={3}
          className={inputClass}
          value={sectionGoal}
          onChange={(e) => setSectionGoal(e.target.value)}
          placeholder="e.g. 250-word team and experience for the portal; or case for support on local impact"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="mitchell-word-limit">
            Target length (words, optional)
          </label>
          <input
            id="mitchell-word-limit"
            type="number"
            min={50}
            max={8000}
            className={inputClass}
            value={wordLimit}
            onChange={(e) => setWordLimit(e.target.value)}
            placeholder="e.g. 250"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="mitchell-extra">
          Extra instructions (optional)
        </label>
        <textarea
          id="mitchell-extra"
          rows={2}
          className={inputClass}
          value={extraInstructions}
          onChange={(e) => setExtraInstructions(e.target.value)}
          placeholder="Tone, funder pet peeves, must-mention products, etc."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mitchell-paste">
          Paste text for this run only (optional)
        </label>
        <textarea
          id="mitchell-paste"
          rows={4}
          className={inputClass}
          value={pastedContext}
          onChange={(e) => setPastedContext(e.target.value)}
          placeholder="CV bullets, bio, or past application text — not saved; only used for this draft."
        />
        <p className="mt-1 text-xs text-zinc-500">
          Not stored — use Knowledge links for anything you want to keep.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MitchellAvatar size={36} />
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => {
            setMsg(null);
            start(async () => {
              const wl = wordLimit.trim();
              const n = wl ? Number.parseInt(wl, 10) : null;
              const r = await runMitchellSectionDraftForOpportunity(
                props.opportunityId,
                {
                  sectionGoal,
                  extraInstructions: extraInstructions.trim() || undefined,
                  pastedContext: pastedContext.trim() || undefined,
                  wordLimit:
                    n != null && Number.isFinite(n) && n >= 50 ? n : undefined,
                },
              );
              if (r.ok) {
                setMsg(`Draft saved (model: ${r.model}).`);
                router.refresh();
              } else {
                setMsg(r.error);
              }
            });
          }}
        >
          {pending ? "Drafting…" : "Generate first draft"}
        </button>
      </div>

      {msg ? (
        <p
          className={`text-sm ${msg.startsWith("Draft") ? "text-emerald-400/90" : "text-red-400"}`}
        >
          {msg}
        </p>
      ) : null}

      {props.initialDraftMd?.trim() ? (
        <div className="space-y-6">
          <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Latest draft
            </p>
            <MarkdownPreview markdown={props.initialDraftMd} />
          </div>
          {props.initialFollowupMd?.trim() ? (
            <div className="rounded-md border border-amber-900/40 bg-amber-950/20 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-200/80">
                Blanks &amp; materials Mitchell needs
              </p>
              <MarkdownPreview markdown={props.initialFollowupMd} />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">
          No section draft yet — fill in what you need above and run generate.
        </p>
      )}
    </div>
  );
}

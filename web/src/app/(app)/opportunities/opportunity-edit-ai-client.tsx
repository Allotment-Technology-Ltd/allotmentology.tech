"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  enrichOpportunityFromGrantUrl,
  runAiFullOpportunityScoring,
} from "./opportunity-ai-actions";

const btn =
  "rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50";

export function OpportunityEditGrantEnrichButton(props: {
  opportunityId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await enrichOpportunityFromGrantUrl(props.opportunityId);
            if (r.ok) {
              setMsg(`Updated (model: ${r.model}).`);
              router.refresh();
            } else {
              setMsg(r.error);
            }
          });
        }}
      >
        {pending ? "Pulling…" : "Pull details from grant URL"}
      </button>
      {msg ? (
        <p
          className={`text-sm ${msg.startsWith("Updated") ? "text-emerald-400/90" : "text-red-400"}`}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}

export function OpportunityEditAiScoringButton(props: {
  opportunityId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await runAiFullOpportunityScoring(props.opportunityId);
            if (r.ok) {
              setMsg(`Scores saved (model: ${r.model}).`);
              router.refresh();
            } else {
              setMsg(r.error);
            }
          });
        }}
      >
        {pending ? "Scoring…" : "Run AI triage (all dimensions + rationale)"}
      </button>
      {msg ? (
        <p
          className={`text-sm ${msg.startsWith("Scores") ? "text-emerald-400/90" : "text-red-400"}`}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}

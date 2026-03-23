"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MitchellAvatar } from "@/components/mitchell-avatar";

import { runMitchellGrantIntake } from "./opportunity-ai-actions";

const btn =
  "rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50";

export function OpportunityMitchellIntakeButton(props: {
  opportunityId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <MitchellAvatar size={40} />
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => {
            setMsg(null);
            start(async () => {
              const r = await runMitchellGrantIntake(props.opportunityId);
              if (r.ok) {
                setMsg(
                  "Mitchell’s done — fetched the page, updated fields, ran scores, and saved his brief.",
                );
                router.refresh();
              } else {
                setMsg(r.error);
              }
            });
          }}
        >
          {pending ? "Mitchell’s on it…" : "Run Mitchell intake"}
        </button>
      </div>
      {msg ? (
        <p
          className={`whitespace-pre-wrap text-sm ${msg.startsWith("Mitchell") ? "text-emerald-400/90" : "text-red-400"}`}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}

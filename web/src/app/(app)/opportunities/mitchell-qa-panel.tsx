"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MarkdownPreview } from "@/app/(app)/collateral/markdown-preview";
import { MitchellAvatar } from "@/components/mitchell-avatar";

import { runMitchellQaForOpportunity } from "./opportunity-ai-actions";

const labelClass = "mb-1 block text-sm font-medium text-zinc-300";
const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const btn =
  "rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50";

export function MitchellQaPanel(props: {
  opportunityId: string;
  initialQuestion: string | null;
  initialNotes: string | null;
  initialResponse: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [question, setQuestion] = useState(props.initialQuestion ?? "");
  const [notes, setNotes] = useState(props.initialNotes ?? "");
  const [response, setResponse] = useState(props.initialResponse ?? "");

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Paste a question from the application form. Add notes (constraints, word limits, what
        assessors care about). Mitchell answers using this opportunity,{" "}
        <strong className="text-zinc-400">Knowledge links</strong>, approved collateral, your
        product fit notes, optional grant page text, and your writing style profile when set.
      </p>

      <div>
        <label className={labelClass} htmlFor="mitchell-qa-question">
          Question
        </label>
        <textarea
          id="mitchell-qa-question"
          name="question"
          rows={5}
          className={inputClass}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Paste the exact prompt from the funder portal or form."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mitchell-qa-notes">
          Notes
        </label>
        <textarea
          id="mitchell-qa-notes"
          name="notes"
          rows={3}
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional: tone, must-mentions, evidence you will add later, word cap…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MitchellAvatar size={36} />
        <button
          type="button"
          disabled={pending || !question.trim()}
          className={btn}
          onClick={() => {
            setMsg(null);
            start(async () => {
              const r = await runMitchellQaForOpportunity(props.opportunityId, {
                question,
                notes,
              });
              if (!r.ok) {
                setMsg(r.error);
                return;
              }
              setResponse(r.responseMarkdown);
              setMsg("Saved Mitchell’s response below.");
              router.refresh();
            });
          }}
        >
          {pending ? "Writing…" : "Generate response"}
        </button>
      </div>

      {msg ? (
        <p
          className={`text-sm ${msg.startsWith("Saved") ? "text-emerald-400/90" : "text-red-400"}`}
        >
          {msg}
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="mitchell-qa-response">
          Response
        </label>
        <p className="mb-2 text-xs text-zinc-500">
          Generated answer (Markdown). Copy into the portal; verify facts before submit.
        </p>
        {response.trim() ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-200">
            <MarkdownPreview markdown={response} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No response yet — add a question and generate.</p>
        )}
      </div>
    </div>
  );
}

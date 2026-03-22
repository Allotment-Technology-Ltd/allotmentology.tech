"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { submissionPacks } from "@/db/schema/tables";
import {
  PACK_STATUSES,
  PACK_STATUS_LABEL,
} from "@/lib/opportunities/constants";
import { formatDate } from "@/lib/format";
import { PACK_FIELD_LABEL } from "@/lib/submission-packs/constants";

import { saveSubmissionPack, type PackFormState } from "./actions";
import { ChecklistEditor } from "./checklist-editor";
import { CopyPackMarkdownButton } from "./copy-pack-markdown-button";

const initial: PackFormState = { error: null };

const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";
const label = "mb-1 block text-xs font-medium text-zinc-500";

type PackRow = typeof submissionPacks.$inferSelect;

export function PackWorkspaceClient(props: {
  pack: PackRow;
  opportunityId: string;
  opportunityTitle: string;
  funderName: string | null;
  readinessOk: boolean;
  readinessIssues: string[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveSubmissionPack, initial);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  const p = props.pack;
  const statusLabel = PACK_STATUS_LABEL[p.status];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Submission pack
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {p.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-400">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
              {statusLabel}
            </span>
            <span>Updated {formatDate(p.updatedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <CopyPackMarkdownButton
            formId="submission-pack-form"
            opportunityTitle={props.opportunityTitle}
            funderName={props.funderName}
          />
          <Link
            href={`/opportunities/${props.opportunityId}#packs`}
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← Opportunity
          </Link>
          <Link
            href="/submission-packs"
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            All packs
          </Link>
        </div>
      </div>

      {!props.readinessOk ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          <p className="font-medium text-amber-100">Not yet ready for “Ready” or “Submitted”</p>
          <p className="mt-1 text-amber-100/75">
            You can keep editing while in Draft or In review. To set status to Ready or Submitted,
            resolve the following:
          </p>
          <ul className="mt-2 list-inside list-disc text-amber-100/80">
            {props.readinessIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
          Pack passes the ready-to-submit checklist. You may set status to Ready or Submitted when
          you are satisfied.
        </div>
      )}

      <form id="submission-pack-form" action={formAction} className="space-y-8">
        <input type="hidden" name="id" value={p.id} />

        {state.error ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            <p>{state.error}</p>
            {state.issues && state.issues.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-red-200/80">
                {state.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="title">
              Pack title
            </label>
            <input
              id="title"
              name="title"
              defaultValue={p.title}
              className={input}
              required
            />
          </div>
          <div>
            <label className={label} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={p.status}
              className={input}
            >
              {PACK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PACK_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-600">
              Ready and Submitted are blocked until the pack passes validation.
            </p>
          </div>
        </div>

        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
          <h2 className="text-lg font-medium text-zinc-100">Narrative</h2>
          <div>
            <label className={label} htmlFor="workingThesis">
              {PACK_FIELD_LABEL.workingThesis}
            </label>
            <textarea
              id="workingThesis"
              name="workingThesis"
              rows={4}
              className={input}
              defaultValue={p.workingThesis}
            />
          </div>
          <div>
            <label className={label} htmlFor="projectFraming">
              {PACK_FIELD_LABEL.projectFraming}
            </label>
            <textarea
              id="projectFraming"
              name="projectFraming"
              rows={4}
              className={input}
              defaultValue={p.projectFraming}
            />
          </div>
          <div>
            <label className={label} htmlFor="summary100">
              {PACK_FIELD_LABEL.summary100}
            </label>
            <textarea
              id="summary100"
              name="summary100"
              rows={4}
              className={input}
              defaultValue={p.summary100}
            />
          </div>
          <div>
            <label className={label} htmlFor="summary250">
              {PACK_FIELD_LABEL.summary250}
            </label>
            <textarea
              id="summary250"
              name="summary250"
              rows={6}
              className={input}
              defaultValue={p.summary250}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
          <h2 className="text-lg font-medium text-zinc-100">Application draft</h2>
          <div>
            <label className={label} htmlFor="draftAnswersMd">
              {PACK_FIELD_LABEL.draftAnswersMd}
            </label>
            <textarea
              id="draftAnswersMd"
              name="draftAnswersMd"
              rows={12}
              className={input}
              spellCheck={false}
              defaultValue={p.draftAnswersMd}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
          <h2 className="text-lg font-medium text-zinc-100">Gaps & risks</h2>
          <div>
            <label className={label} htmlFor="missingInputsMd">
              {PACK_FIELD_LABEL.missingInputsMd}
            </label>
            <textarea
              id="missingInputsMd"
              name="missingInputsMd"
              rows={5}
              className={input}
              spellCheck={false}
              defaultValue={p.missingInputsMd}
              placeholder="List gaps, or write “None”."
            />
          </div>
          <div>
            <label className={label} htmlFor="risksMd">
              {PACK_FIELD_LABEL.risksMd}
            </label>
            <textarea
              id="risksMd"
              name="risksMd"
              rows={5}
              className={input}
              spellCheck={false}
              defaultValue={p.risksMd}
              placeholder="List risks and mitigations, or “None identified”."
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
          <h2 className="text-lg font-medium text-zinc-100">Checklist</h2>
          <p className="text-sm text-zinc-500">
            Use Markdown task lists. Tick items here or edit the Markdown directly — both stay in
            sync.
          </p>
          <ChecklistEditor
            key={`${p.id}-${p.updatedAt?.toString() ?? ""}`}
            initial={p.checklistMd}
            name="checklistMd"
          />
        </section>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
        >
          Save pack
        </button>
      </form>
    </div>
  );
}

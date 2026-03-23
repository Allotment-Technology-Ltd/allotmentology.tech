"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  CONFLICT_SEVERITIES,
  CONFLICT_SEVERITY_LABEL,
  PACK_STATUSES,
  PACK_STATUS_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
} from "@/lib/opportunities/constants";
import {
  SCORE_DIMENSION_KEYS,
  SCORE_FIELD_COPY,
  type ScoreDimensionKey,
} from "@/lib/opportunities/scoring-engine";

import {
  addConflictForOpportunity,
  createAndLinkKnowledgeAsset,
  addPackForOpportunity,
  addTaskForOpportunity,
  deleteConflictForOpportunity,
  linkKnowledgeToOpportunity,
  deletePackForOpportunity,
  deleteTaskForOpportunity,
  unlinkKnowledgeForOpportunity,
  saveOpportunityScore,
  type FormState,
} from "./actions";

const initial: FormState = { error: null };

const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";
const label = "mb-1 block text-xs font-medium text-zinc-500";

export type ScoreFormInitial = Record<ScoreDimensionKey, number | null> & {
  rationale: string | null;
};

export function ScoreInlineForm(props: {
  opportunityId: string;
  initial: ScoreFormInitial;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    saveOpportunityScore,
    initial,
  );
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  const v = props.initial;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="opportunityId" value={props.opportunityId} />
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      <p className="text-sm text-zinc-500">
        All dimensions are 1–5. Leave blank to exclude from the weighted total;
        weights renormalise across filled fields. Effort: 1 = light, 5 = heavy.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SCORE_DIMENSION_KEYS.map((key) => {
          const copy = SCORE_FIELD_COPY[key];
          return (
            <div key={key}>
              <label className={label} htmlFor={key}>
                {copy.label}
              </label>
              <p className="mb-1 text-[11px] leading-snug text-zinc-600">
                {copy.hint}
              </p>
              <input
                id={key}
                name={key}
                type="number"
                min={1}
                max={5}
                className={input}
                defaultValue={v[key] ?? ""}
              />
            </div>
          );
        })}
      </div>
      <div>
        <label className={label} htmlFor="rationale">
          Rationale
        </label>
        <textarea
          id="rationale"
          name="rationale"
          rows={4}
          className={input}
          defaultValue={v.rationale ?? ""}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
      >
        Save scores
      </button>
    </form>
  );
}

export function TaskQuickForm({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    addTaskForOpportunity,
    initial,
  );
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 rounded-md border border-zinc-800 bg-zinc-950/40 p-3"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Task title"
        className={input}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="taskDue">
            Due
          </label>
          <input
            id="taskDue"
            name="dueAt"
            type="datetime-local"
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="taskStatus">
            Status
          </label>
          <select
            id="taskStatus"
            name="status"
            className={input}
            defaultValue="todo"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        Add task
      </button>
    </form>
  );
}

export function PackQuickForm({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    addPackForOpportunity,
    initial,
  );
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 rounded-md border border-zinc-800 bg-zinc-950/40 p-3"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Pack title"
        className={input}
      />
      <div>
        <label className={label} htmlFor="packStatus">
          Status
        </label>
        <select
          id="packStatus"
          name="status"
          className={input}
          defaultValue="draft"
        >
          {PACK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PACK_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        Add submission pack
      </button>
    </form>
  );
}

export function ConflictQuickForm({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    addConflictForOpportunity,
    initial,
  );
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 rounded-md border border-zinc-800 bg-zinc-950/40 p-3"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder="Conflict title"
        className={input}
      />
      <textarea
        name="detail"
        rows={2}
        placeholder="Detail (optional)"
        className={input}
      />
      <div>
        <label className={label} htmlFor="severity">
          Severity
        </label>
        <select
          id="severity"
          name="severity"
          className={input}
          defaultValue="medium"
        >
          {CONFLICT_SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {CONFLICT_SEVERITY_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        Log conflict
      </button>
    </form>
  );
}

export function DeleteEntityButton(props: {
  kind: "task" | "pack" | "conflict" | "knowledge";
  id: string;
  opportunityId: string;
}) {
  const action =
    props.kind === "task"
      ? deleteTaskForOpportunity
      : props.kind === "pack"
        ? deletePackForOpportunity
        : props.kind === "conflict"
          ? deleteConflictForOpportunity
          : unlinkKnowledgeForOpportunity;

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="opportunityId" value={props.opportunityId} />
      {props.kind === "knowledge" ? (
        <input type="hidden" name="knowledgeAssetId" value={props.id} />
      ) : null}
      <button
        type="submit"
        className="text-xs text-red-400/90 hover:text-red-300"
        onClick={(e) => {
          if (!window.confirm("Remove this row?")) {
            e.preventDefault();
          }
        }}
      >
        {props.kind === "knowledge" ? "Unlink" : "Remove"}
      </button>
    </form>
  );
}

export function KnowledgeLinkForm(props: {
  opportunityId: string;
  options: Array<{
    id: string;
    title: string;
    sourceType: string;
    url: string;
  }>;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    linkKnowledgeToOpportunity,
    initial,
  );
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 rounded-md border border-zinc-800 bg-zinc-950/40 p-3"
    >
      <input type="hidden" name="opportunityId" value={props.opportunityId} />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <div>
        <label className={label} htmlFor="knowledgeAssetId">
          Link existing asset
        </label>
        <select
          id="knowledgeAssetId"
          name="knowledgeAssetId"
          className={input}
          defaultValue={props.options[0]?.id ?? ""}
        >
          {props.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} ({o.sourceType})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="relevanceNote"
          placeholder="Relevance note (optional)"
          className={input}
        />
        <input
          name="priority"
          type="number"
          min={1}
          max={5}
          defaultValue={3}
          className={input}
        />
      </div>
      <button
        type="submit"
        disabled={pending || props.options.length === 0}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        Link asset
      </button>
    </form>
  );
}

export function KnowledgeQuickCreateForm({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createAndLinkKnowledgeAsset,
    initial,
  );
  const pendingRef = useRef(false);
  useEffect(() => {
    if (pendingRef.current && !pending && state.error === null) {
      router.refresh();
    }
    pendingRef.current = pending;
  }, [pending, state.error, router]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 rounded-md border border-zinc-800 bg-zinc-950/40 p-3"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <input name="title" required placeholder="Asset title" className={input} />
      <input name="url" type="url" required placeholder="https://…" className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <select name="sourceType" className={input} defaultValue="repository">
          <option value="repository">repository</option>
          <option value="document">document</option>
          <option value="file">file</option>
          <option value="portal">portal</option>
          <option value="other">other</option>
        </select>
        <input name="tags" placeholder="tag1, tag2" className={input} />
      </div>
      <textarea
        name="summary"
        rows={2}
        placeholder="Summary (optional)"
        className={input}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="relevanceNote" placeholder="Relevance note (optional)" className={input} />
        <input
          name="priority"
          type="number"
          min={1}
          max={5}
          defaultValue={3}
          className={input}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        Create and link asset
      </button>
    </form>
  );
}

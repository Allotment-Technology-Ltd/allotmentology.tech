"use client";

import { useActionState } from "react";

import {
  COLLATERAL_KINDS,
  COLLATERAL_KIND_LABEL,
} from "@/lib/collateral/constants";

import { saveCollateral, type FormState } from "./actions";

const initial: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

export function CollateralFormClient(props: {
  collateralId?: string;
  defaultTitle: string;
  defaultKind: (typeof COLLATERAL_KINDS)[number];
  defaultBody: string;
  defaultTags: string;
  defaultApproved: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(saveCollateral, initial);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      {props.collateralId ? (
        <input type="hidden" name="id" value={props.collateralId} />
      ) : null}
      {state.error ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className={inputClass}
          defaultValue={props.defaultTitle}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="kind">
          Type
        </label>
        <select
          id="kind"
          name="kind"
          className={inputClass}
          defaultValue={props.defaultKind}
        >
          {COLLATERAL_KINDS.map((k) => (
            <option key={k} value={k}>
              {COLLATERAL_KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="tags">
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          className={inputClass}
          defaultValue={props.defaultTags}
          placeholder="comma, separated, tags"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="body">
          Body (Markdown)
        </label>
        <textarea
          id="body"
          name="body"
          rows={18}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
          defaultValue={props.defaultBody}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="approved"
          name="approved"
          type="checkbox"
          value="1"
          defaultChecked={props.defaultApproved}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
        />
        <label htmlFor="approved" className="text-sm text-zinc-300">
          Mark as approved (ready to reuse in applications)
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {props.submitLabel}
      </button>
    </form>
  );
}

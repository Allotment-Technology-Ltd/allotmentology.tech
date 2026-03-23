"use client";

import { useActionState } from "react";

import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABEL,
} from "@/lib/opportunities/constants";
import { toDatetimeLocalValue } from "@/lib/format";

import { saveOpportunity, type FormState } from "./actions";

const initial: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

type UserOpt = { id: string; label: string };

export type OpportunityFormDefaults = {
  title: string;
  summary: string;
  funderName: string;
  closesAt: Date | string | null;
  status: (typeof OPPORTUNITY_STATUSES)[number];
  ownerUserId: string;
  eligibilityNotes: string;
  internalNotes: string;
  estimatedValue: string;
  currencyCode: string;
  grantUrl: string;
  productFitAssessmentMd: string;
};

export function OpportunityFormClient(props: {
  opportunityId?: string;
  defaultValues: OpportunityFormDefaults;
  userOptions: UserOpt[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(saveOpportunity, initial);
  const v = props.defaultValues;

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {props.opportunityId ? (
        <>
          <input type="hidden" name="id" value={props.opportunityId} />
          <input type="hidden" name="redirectTo" value="edit" />
        </>
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
          defaultValue={v.title}
          placeholder="Programme or call name"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="funderName">
            Funder
          </label>
          <input
            id="funderName"
            name="funderName"
            className={inputClass}
            defaultValue={v.funderName}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className={inputClass}
            defaultValue={v.status}
          >
            {OPPORTUNITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {OPPORTUNITY_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="closesAt">
          Deadline
        </label>
        <input
          id="closesAt"
          name="closesAt"
          type="datetime-local"
          className={inputClass}
          defaultValue={toDatetimeLocalValue(v.closesAt)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ownerUserId">
          Owner
        </label>
        <select
          id="ownerUserId"
          name="ownerUserId"
          className={inputClass}
          defaultValue={v.ownerUserId}
        >
          <option value="">Unassigned</option>
          {props.userOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="grantUrl">
          Grant / fund URL
        </label>
        <input
          id="grantUrl"
          name="grantUrl"
          type="url"
          className={inputClass}
          defaultValue={v.grantUrl}
          placeholder="https://…"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Official programme or call page. Mitchell can fetch this page, fill what we
          can, run triage scores, and leave you a straight-talking brief (when AI is
          configured).
        </p>
      </div>

      {props.opportunityId ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              name="mitchellAfterSave"
              value="1"
              className="rounded border-zinc-600 bg-zinc-900"
            />
            After saving, run Mitchell intake (fetch URL, scores, brief)
          </label>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="summary">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          className={inputClass}
          defaultValue={v.summary}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="productFitAssessmentMd">
          Product fit & eligibility assessment
        </label>
        <textarea
          id="productFitAssessmentMd"
          name="productFitAssessmentMd"
          rows={6}
          className={inputClass}
          defaultValue={v.productFitAssessmentMd}
          placeholder="AI can populate weighted product recommendations when you pull from the grant URL."
        />
        <p className="mt-1 text-xs text-zinc-500">
          Initial assessment vs approved collateral / products — usually filled by
          Mitchell intake; you can edit before saving.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="eligibilityNotes">
          Eligibility notes
        </label>
        <textarea
          id="eligibilityNotes"
          name="eligibilityNotes"
          rows={4}
          className={inputClass}
          defaultValue={v.eligibilityNotes}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="internalNotes">
          Internal notes
        </label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={4}
          className={inputClass}
          defaultValue={v.internalNotes}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="estimatedValue">
            Estimated value
          </label>
          <input
            id="estimatedValue"
            name="estimatedValue"
            type="text"
            inputMode="decimal"
            className={inputClass}
            defaultValue={v.estimatedValue}
            placeholder="e.g. 150000"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="currencyCode">
            Currency
          </label>
          <select
            id="currencyCode"
            name="currencyCode"
            className={inputClass}
            defaultValue={v.currencyCode || "GBP"}
          >
            {["GBP", "EUR", "USD"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          {props.submitLabel}
        </button>
      </div>
    </form>
  );
}

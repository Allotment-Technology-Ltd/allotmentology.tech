import Link from "next/link";
import { notFound } from "next/navigation";

import { loadOpportunityDetail, loadUserOptions } from "../../actions";
import { OpportunityFormClient } from "../../opportunity-form-client";

export const dynamic = "force-dynamic";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadOpportunityDetail(id);
  if (!detail) notFound();

  const userOptions = await loadUserOptions();
  const o = detail.opportunity;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Edit opportunity
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{o.title}</p>
        </div>
        <Link
          href={`/opportunities/${id}`}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Back to detail
        </Link>
      </div>
      <OpportunityFormClient
        opportunityId={id}
        userOptions={userOptions}
        submitLabel="Save changes"
        defaultValues={{
          title: o.title,
          summary: o.summary ?? "",
          funderName: o.funderName ?? "",
          closesAt: o.closesAt,
          status: o.status,
          ownerUserId: o.ownerUserId ?? "",
          eligibilityNotes: o.eligibilityNotes ?? "",
          internalNotes: o.internalNotes ?? "",
          estimatedValue:
            o.estimatedValue != null ? String(o.estimatedValue) : "",
          currencyCode: o.currencyCode ?? "GBP",
        }}
      />
    </div>
  );
}

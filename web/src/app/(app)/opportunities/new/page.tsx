import { OpportunityFormClient } from "../opportunity-form-client";
import { loadUserOptions } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  const userOptions = await loadUserOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          New opportunity
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Capture a funding call or programme; add eligibility and notes on the
          detail page anytime.
        </p>
      </div>
      <OpportunityFormClient
        userOptions={userOptions}
        submitLabel="Create opportunity"
        defaultValues={{
          title: "",
          summary: "",
          funderName: "",
          closesAt: null,
          status: "draft",
          ownerUserId: "",
          eligibilityNotes: "",
          internalNotes: "",
          estimatedValue: "",
          currencyCode: "GBP",
          grantUrl: "",
          productFitAssessmentMd: "",
        }}
      />
    </div>
  );
}

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
          Capture a funding call or programme. If you paste a grant URL and save,
          Mitchell runs intake automatically (fetch, scores, brief) when AI is
          configured.
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

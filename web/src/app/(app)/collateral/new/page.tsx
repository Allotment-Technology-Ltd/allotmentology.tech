import { CollateralFormClient } from "../collateral-form-client";

export const dynamic = "force-dynamic";

export default function NewCollateralPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          New collateral
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Store Markdown snippets you can paste or reference from submission
          packs. Bump version is automatic on each save when editing.
        </p>
      </div>
      <CollateralFormClient
        defaultTitle=""
        defaultKind="standard_answer"
        defaultBody=""
        defaultTags=""
        defaultApproved={false}
        submitLabel="Create collateral"
      />
    </div>
  );
}

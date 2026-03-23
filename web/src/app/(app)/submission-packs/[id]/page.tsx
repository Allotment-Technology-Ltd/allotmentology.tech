import { notFound } from "next/navigation";

import { evaluateSubmissionPackReadiness } from "@/lib/submission-packs/readiness";

import { loadSubmissionPackDetail } from "@/lib/submission-packs/queries";
import { PackWorkspaceClient } from "../pack-workspace-client";

export const dynamic = "force-dynamic";

export default async function SubmissionPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await loadSubmissionPackDetail(id);
  if (!row) notFound();

  const readiness = evaluateSubmissionPackReadiness({
    workingThesis: row.pack.workingThesis,
    projectFraming: row.pack.projectFraming,
    summary100: row.pack.summary100,
    summary250: row.pack.summary250,
    draftAnswersMd: row.pack.draftAnswersMd,
    missingInputsMd: row.pack.missingInputsMd,
    risksMd: row.pack.risksMd,
    checklistMd: row.pack.checklistMd,
  });

  return (
    <PackWorkspaceClient
      pack={row.pack}
      opportunityId={row.opportunityId}
      opportunityTitle={row.opportunityTitle}
      funderName={row.funderName}
      readinessOk={readiness.ok}
      readinessIssues={readiness.issues}
    />
  );
}

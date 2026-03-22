import { PACK_FIELD_LABEL } from "./constants";
import { PACK_STATUS_LABEL } from "@/lib/opportunities/constants";

export type PackExportPayload = {
  title: string;
  status: keyof typeof PACK_STATUS_LABEL;
  workingThesis: string;
  projectFraming: string;
  summary100: string;
  summary250: string;
  draftAnswersMd: string;
  missingInputsMd: string;
  risksMd: string;
  checklistMd: string;
};

export function buildPackExportMarkdown(
  pack: PackExportPayload,
  context: { opportunityTitle: string; funderName: string | null },
): string {
  const lines: string[] = [
    `# ${pack.title}`,
    "",
    `**Pack status:** ${PACK_STATUS_LABEL[pack.status]}`,
    `**Opportunity:** ${context.opportunityTitle}`,
  ];
  if (context.funderName?.trim()) {
    lines.push(`**Funder:** ${context.funderName.trim()}`);
  }
  lines.push("", "---", "");

  const sections: [string, string][] = [
    [PACK_FIELD_LABEL.workingThesis, pack.workingThesis],
    [PACK_FIELD_LABEL.projectFraming, pack.projectFraming],
    [PACK_FIELD_LABEL.summary100, pack.summary100],
    [PACK_FIELD_LABEL.summary250, pack.summary250],
    [PACK_FIELD_LABEL.draftAnswersMd, pack.draftAnswersMd],
    [PACK_FIELD_LABEL.missingInputsMd, pack.missingInputsMd],
    [PACK_FIELD_LABEL.risksMd, pack.risksMd],
    [PACK_FIELD_LABEL.checklistMd, pack.checklistMd],
  ];

  for (const [heading, body] of sections) {
    lines.push(`## ${heading}`, "", body.trim() || "_—_", "", "");
  }

  return lines.join("\n").trimEnd() + "\n";
}

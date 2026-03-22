import { PACK_FIELD_LABEL } from "./constants";

export type PackReadinessInput = {
  workingThesis: string;
  projectFraming: string;
  summary100: string;
  summary250: string;
  draftAnswersMd: string;
  missingInputsMd: string;
  risksMd: string;
  checklistMd: string;
};

const CHECKBOX_LINE =
  /^(\s*[-*]\s*)\[([ xX])\]\s*(.*)$/;

/** Lines that look like `- [ ] item` or `* [x] item`. */
export function parseChecklistCheckboxLines(md: string): {
  lineIndex: number;
  checked: boolean;
  text: string;
}[] {
  const lines = md.split(/\r?\n/);
  const out: { lineIndex: number; checked: boolean; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(CHECKBOX_LINE);
    if (m) {
      out.push({
        lineIndex: i,
        checked: m[2].toLowerCase() === "x",
        text: m[3],
      });
    }
  }
  return out;
}

export function setChecklistLineChecked(
  md: string,
  lineIndex: number,
  checked: boolean,
): string {
  const lines = md.split(/\r?\n/);
  const line = lines[lineIndex];
  if (line == null) return md;
  const m = line.match(CHECKBOX_LINE);
  if (!m) return md;
  const mark = checked ? "x" : " ";
  lines[lineIndex] = `${m[1]}[${mark}] ${m[3]}`;
  return lines.join("\n");
}

function nonEmpty(s: string, minLen: number): boolean {
  return s.trim().length >= minLen;
}

/**
 * Gate for setting status to **ready** or **submitted**:
 * core copy exists, missing inputs and risks are acknowledged, checklist is a task list and fully checked.
 */
export function evaluateSubmissionPackReadiness(
  p: PackReadinessInput,
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!nonEmpty(p.workingThesis, 12)) {
    issues.push(`${PACK_FIELD_LABEL.workingThesis} needs a short paragraph (about 12+ characters).`);
  }
  if (!nonEmpty(p.projectFraming, 12)) {
    issues.push(`${PACK_FIELD_LABEL.projectFraming} needs content.`);
  }
  if (!nonEmpty(p.summary100, 20)) {
    issues.push(`${PACK_FIELD_LABEL.summary100} is too short or empty.`);
  }
  if (!nonEmpty(p.summary250, 40)) {
    issues.push(`${PACK_FIELD_LABEL.summary250} is too short or empty.`);
  }
  if (!nonEmpty(p.draftAnswersMd, 24)) {
    issues.push(`${PACK_FIELD_LABEL.draftAnswersMd} needs draft material.`);
  }
  if (!nonEmpty(p.missingInputsMd, 2)) {
    issues.push(
      `Document ${PACK_FIELD_LABEL.missingInputsMd.toLowerCase()} (use “None” if nothing is missing).`,
    );
  }
  if (!nonEmpty(p.risksMd, 2)) {
    issues.push(
      `Document ${PACK_FIELD_LABEL.risksMd.toLowerCase()} (use “None identified” if applicable).`,
    );
  }

  const boxes = parseChecklistCheckboxLines(p.checklistMd);
  if (boxes.length === 0) {
    issues.push(
      "Add at least one Markdown checklist item (e.g. “- [ ] Attach financial annex”).",
    );
  } else {
    const open = boxes.filter((b) => !b.checked);
    if (open.length > 0) {
      issues.push(
        `Checklist: ${open.length} item(s) still open — tick them in the checklist or fix the text before marking ready.`,
      );
    }
  }

  return { ok: issues.length === 0, issues };
}

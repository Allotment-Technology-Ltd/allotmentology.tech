"use client";

import { useState } from "react";

import {
  PACK_STATUSES,
  type PackStatus,
} from "@/lib/opportunities/constants";
import { buildPackExportMarkdown } from "@/lib/submission-packs/export-markdown";

export function CopyPackMarkdownButton(props: {
  formId: string;
  opportunityTitle: string;
  funderName: string | null;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  function onCopy() {
    const el = document.getElementById(props.formId);
    if (!(el instanceof HTMLFormElement)) {
      setMsg("Form not found.");
      return;
    }
    const fd = new FormData(el);
    const title = String(fd.get("title") ?? "").trim();
    const statusRaw = String(fd.get("status") ?? "draft");
    const status: PackStatus = (PACK_STATUSES as readonly string[]).includes(
      statusRaw,
    )
      ? (statusRaw as PackStatus)
      : "draft";
    const pack = {
      title: title || "Untitled pack",
      status,
      workingThesis: String(fd.get("workingThesis") ?? ""),
      projectFraming: String(fd.get("projectFraming") ?? ""),
      summary100: String(fd.get("summary100") ?? ""),
      summary250: String(fd.get("summary250") ?? ""),
      draftAnswersMd: String(fd.get("draftAnswersMd") ?? ""),
      missingInputsMd: String(fd.get("missingInputsMd") ?? ""),
      risksMd: String(fd.get("risksMd") ?? ""),
      checklistMd: String(fd.get("checklistMd") ?? ""),
    };
    const md = buildPackExportMarkdown(pack, {
      opportunityTitle: props.opportunityTitle,
      funderName: props.funderName,
    });
    void navigator.clipboard.writeText(md).then(() => {
      setMsg("Copied to clipboard.");
      setTimeout(() => setMsg(null), 2500);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="rounded-md border border-sky-700/60 bg-sky-950/40 px-3 py-1.5 text-sm text-sky-100 hover:bg-sky-900/50"
      >
        Copy pack as Markdown
      </button>
      {msg ? <span className="text-xs text-zinc-400">{msg}</span> : null}
    </div>
  );
}

"use client";

import { useState } from "react";

import {
  parseChecklistCheckboxLines,
  setChecklistLineChecked,
} from "@/lib/submission-packs/readiness";

const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";

export function ChecklistEditor({
  initial,
  name,
  rows = 8,
}: {
  initial: string;
  name: string;
  /** Textarea height (lines). */
  rows?: number;
}) {
  const [value, setValue] = useState(initial);

  const boxes = parseChecklistCheckboxLines(value);

  return (
    <div className="space-y-3">
      {boxes.length > 0 ? (
        <ul className="space-y-2 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
          {boxes.map((b) => (
            <li key={b.lineIndex} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={b.checked}
                onChange={() =>
                  setValue((v) =>
                    setChecklistLineChecked(v, b.lineIndex, !b.checked),
                  )
                }
              />
              <span className={b.text.trim() ? "text-zinc-200" : "text-zinc-500"}>
                {b.text.trim() || "(empty line — edit in Markdown)"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">
          No task-list items yet. Use Markdown like{" "}
          <code className="rounded bg-zinc-800 px-1 text-zinc-300">
            - [ ] Your item
          </code>{" "}
          in the field below, or add a starter row.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setValue((v) => {
              const t = v.trimEnd();
              return t.length === 0 ? "- [ ] " : `${t}\n- [ ] `;
            })
          }
          className="rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
        >
          Add checklist row
        </button>
      </div>
      <textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        className={input}
        spellCheck={false}
        placeholder={`- [ ] Export final budget\n- [ ] Partner letter attached\n- [ ] Portal answers pasted`}
      />
    </div>
  );
}

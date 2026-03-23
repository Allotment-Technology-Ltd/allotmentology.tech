"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetApplicationFormsByPackId } from "./actions";

const btn =
  "rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50";

export function ResetApplicationFormsButton(props: { packId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() => {
          setErr(null);
          if (
            !window.confirm(
              "Replace the unified application form with the default scaffold? Unsaved edits in the field below are lost unless you saved the pack first.",
            )
          ) {
            return;
          }
          start(async () => {
            const r = await resetApplicationFormsByPackId(props.packId);
            if (r.error) {
              setErr(r.error);
            } else {
              router.refresh();
            }
          });
        }}
      >
        {pending ? "Resetting…" : "Replace with default scaffold"}
      </button>
      {err ? <p className="max-w-xs text-right text-xs text-red-400">{err}</p> : null}
    </div>
  );
}

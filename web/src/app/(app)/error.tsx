"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center rounded-lg border border-red-900/45 bg-red-950/25 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-red-100">Something went wrong</p>
      <p className="mt-2 text-xs leading-relaxed text-red-200/70">
        {error.message || "An unexpected error occurred in this section."}
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[10px] text-red-300/40">Ref: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md border border-red-800/60 bg-red-950/40 px-4 py-2 text-sm text-red-100 hover:bg-red-900/30"
      >
        Try again
      </button>
    </div>
  );
}

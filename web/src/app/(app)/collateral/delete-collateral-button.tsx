"use client";

import { deleteCollateral } from "./actions";

export function DeleteCollateralButton({ id }: { id: string }) {
  return (
    <form action={deleteCollateral} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-red-400/90 hover:text-red-300"
        onClick={(e) => {
          if (!window.confirm("Delete this collateral item? Pack links are removed.")) {
            e.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}

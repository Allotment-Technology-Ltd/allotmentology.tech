"use client";

import { deleteOpportunity } from "./actions";

export function DeleteOpportunityButton({ id }: { id: string }) {
  return (
    <form action={deleteOpportunity} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-red-400/90 hover:text-red-300"
        onClick={(e) => {
          if (
            !window.confirm(
              "Delete this opportunity? Related submission packs and scores are removed; tasks may be unlinked.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}

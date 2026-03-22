import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function ConflictsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Application conflicts
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Conflicts are stored on each opportunity (eligibility risks, competing
          narratives). This page is a hub; the live list lives on opportunity
          detail.
        </p>
      </div>
      <EmptyState
        title="No global conflicts view yet"
        description="Open an opportunity and scroll to Application conflicts to log or review items."
      >
        <Link
          href="/opportunities"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Go to opportunities
        </Link>
      </EmptyState>
    </div>
  );
}

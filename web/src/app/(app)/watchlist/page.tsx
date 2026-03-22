import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Source watchlist
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Track funders, portals, and newsletters. The database table exists;
          list UI can be added in a follow-up.
        </p>
      </div>
      <EmptyState
        title="Watchlist UI coming next"
        description="For now, capture opportunities as you find them and link sources in the opportunity summary or internal notes."
      >
        <Link
          href="/opportunities/new"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          New opportunity
        </Link>
      </EmptyState>
    </div>
  );
}

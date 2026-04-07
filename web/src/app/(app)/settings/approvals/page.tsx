import Link from "next/link";

import {
  approveUserAccessAction,
  loadApprovalsPageData,
  rejectUserAccessAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const data = await loadApprovalsPageData();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
          Account approvals
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          New accounts can sign in, but they do not enter the workspace until an
          admin approves access.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Pending requests</h2>
        {data.pending.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-500">
            No pending requests.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.pending.map((user) => (
              <li
                key={user.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
              >
                <p className="text-sm font-medium text-zinc-100">
                  {user.displayName?.trim() || user.email}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Requested {user.createdAt.toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={approveUserAccessAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-50 hover:bg-emerald-600"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectUserAccessAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/35 p-4">
          <h2 className="text-sm font-medium text-zinc-200">Recently approved</h2>
          {data.recentlyApproved.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">No approved users yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
              {data.recentlyApproved.map((user) => (
                <li key={user.id}>
                  {user.displayName?.trim() || user.email}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/35 p-4">
          <h2 className="text-sm font-medium text-zinc-200">Recently rejected</h2>
          {data.recentlyRejected.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">No rejected users.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
              {data.recentlyRejected.map((user) => (
                <li key={user.id}>
                  {user.displayName?.trim() || user.email}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Link
        href="/settings"
        className="inline-block rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Back to settings
      </Link>
    </div>
  );
}

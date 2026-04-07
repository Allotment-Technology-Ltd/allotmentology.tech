import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSessionAppUserOrRedirect } from "@/lib/auth/access-control.server";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const appUser = await requireSessionAppUserOrRedirect();
  if (appUser.approvalStatus === "approved") {
    redirect("/dashboard");
  }

  const rejected = appUser.approvalStatus === "rejected";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Workspace access
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
          {rejected ? "Access request not approved" : "Account pending approval"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {rejected
            ? "Your account is signed in, but workspace access is currently blocked. Contact the workspace admin if this is unexpected."
            : "You are signed in successfully. A workspace admin still needs to approve your account before you can access the dashboard."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Back to showcase
        </Link>
        <Link
          href="/auth/sign-out"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Sign out
        </Link>
      </div>
      <p className="text-xs text-zinc-500">
        Need access? Contact{" "}
        <a
          href="mailto:admin@usesophia.app"
          className="text-sky-400 hover:text-sky-300 hover:underline"
        >
          admin@usesophia.app
        </a>
        .
      </p>
    </main>
  );
}

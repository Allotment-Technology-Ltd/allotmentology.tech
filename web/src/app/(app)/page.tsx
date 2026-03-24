import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

const shortcuts = [
  {
    href: "/opportunities",
    label: "Opportunities",
    desc: "Pipeline, scoring, packs, tasks, conflicts",
  },
  {
    href: "/deadlines",
    label: "Deadlines",
    desc: "Tasks by urgency and opportunity close dates",
  },
  {
    href: "/submission-packs",
    label: "Submission packs",
    desc: "Draft packs linked to opportunities",
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    desc: "Global material links + writing style samples",
  },
  {
    href: "/collateral",
    label: "Collateral",
    desc: "Reusable Markdown blocks for applications",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Internal funding workspace: capture opportunities, score fit, draft
          submission packs, and track deadlines. Everything stays in Neon until
          you export or copy out.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Production:{" "}
          <a
            href="https://allotment.work"
            className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
          >
            allotment.work
          </a>
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/35 px-4 py-4 text-sm text-zinc-400">
        <p className="font-medium text-zinc-200">AI in this workspace</p>
        <p className="mt-1 leading-relaxed">
          <strong className="font-medium text-zinc-300">Mitchell</strong> is the grant writer:
          intake (angle, risks, scaffold pointers) and Q&amp;A answers for form questions — on
          each{" "}
          <Link href="/opportunities" className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline">
            opportunity
          </Link>
          . <strong className="font-medium text-zinc-300">Collateral</strong> has Improve / Expand /
          Shorten; <strong className="font-medium text-zinc-300">submission packs</strong> have the
          drafting agent. All use your key from{" "}
          <Link
            href="/settings/restormel-keys"
            className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
          >
            BYOK &amp; AI keys
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-4 transition hover:border-zinc-600 hover:bg-zinc-900/40"
          >
            <p className="text-sm font-medium text-zinc-100 group-hover:text-white">
              {s.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{s.desc}</p>
          </Link>
        ))}
      </div>

      <EmptyState
        title="First session?"
        description="Create an opportunity, add a submission pack from its detail page, then open the pack to draft answers and run the readiness checklist before marking Ready."
      >
        <Link
          href="/opportunities/new"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          New opportunity
        </Link>
        <Link
          href="/opportunities"
          className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          View pipeline
        </Link>
      </EmptyState>
    </div>
  );
}

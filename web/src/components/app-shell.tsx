import Link from "next/link";

import { AuthUserMenu } from "@/components/auth-user-menu";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/collateral", label: "Collateral" },
  { href: "/submission-packs", label: "Submission packs" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/settings", label: "Settings" },
  { href: "/conflicts", label: "Conflicts" },
  { href: "/watchlist", label: "Watchlist" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80">
        <div className="border-b border-zinc-800 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Funding ops
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">
            Allotment Technology
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/80 hover:text-zinc-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/40 px-6 py-3 sm:px-8 sm:py-3.5">
          <p className="text-xs text-zinc-500">Funding ops — signed in</p>
          <AuthUserMenu />
        </header>
        <main className="flex-1 overflow-auto px-5 py-6 sm:px-8 sm:py-7">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

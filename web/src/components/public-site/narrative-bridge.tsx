import Link from "next/link";

import { products } from "@/lib/public-site/content";

/**
 * Story strip: consequence-shaped work → shared method → shipped products (with links).
 */
export function NarrativeBridge() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-950/90 via-zinc-950/60 to-sky-950/20 px-5 py-8 sm:px-8">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.2]" aria-hidden />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">One thread</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          NHS and national public-service delivery taught me how judgment behaves when mistakes are costly.
          Independent products are where the same standards meet a smaller safety net — and where writing
          and case studies keep the reasoning visible.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch sm:gap-3">
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Source context</p>
            <p className="mt-2 text-sm font-medium text-zinc-200">NHS &amp; public service</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Assurance, clinical weight, live migration, national-scale services.
            </p>
          </div>
          <div className="hidden items-center justify-center text-zinc-600 sm:flex" aria-hidden>
            →
          </div>
          <div className="rounded-xl border border-sky-500/25 bg-sky-950/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-400/80">Shared method</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">Evidence &amp; trade-offs</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Clear assumptions, honest backlog, operable releases.
            </p>
          </div>
          <div className="hidden items-center justify-center text-zinc-600 sm:flex" aria-hidden>
            →
          </div>
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Shipped work</p>
            <ul className="mt-2 space-y-2">
              {products.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.href}
                    className="text-sm text-sky-400/90 hover:text-sky-300 hover:underline"
                  >
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-800/80 pt-5 text-xs text-zinc-500">
          <li>
            <Link href="/case-studies" className="text-zinc-300 hover:text-white hover:underline">
              Case studies
            </Link>
            <span className="text-zinc-600"> — delivery essays</span>
          </li>
          <li>
            <Link href="/writing" className="text-zinc-300 hover:text-white hover:underline">
              Writing
            </Link>
            <span className="text-zinc-600"> — method on the record</span>
          </li>
          <li>
            <Link href="/about" className="text-zinc-300 hover:text-white hover:underline">
              About
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

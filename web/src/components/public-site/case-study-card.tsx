import Link from "next/link";

import { EmployerSignalBlock } from "./employer-signal-block";

type CaseStudyCardProps = {
  href: string;
  title: string;
  summary: string;
  category: string;
  whatThisShows: string;
  ctaLabel: string;
};

export function CaseStudyCard({
  href,
  title,
  summary,
  category,
  whatThisShows,
  ctaLabel,
}: CaseStudyCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/45 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-zinc-600/90">
      <div className="h-1 w-full bg-gradient-to-r from-zinc-600 via-zinc-500 to-zinc-600" aria-hidden />
      <div className="border-b border-zinc-800/60 bg-zinc-900/25 px-5 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Case study</p>
        <p className="mt-1 text-xs text-zinc-400">{category}</p>
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-zinc-100 sm:text-xl">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-400">{summary}</p>
        </div>
        <EmployerSignalBlock text={whatThisShows} />
        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition-colors hover:text-sky-300 hover:underline"
        >
          {ctaLabel}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

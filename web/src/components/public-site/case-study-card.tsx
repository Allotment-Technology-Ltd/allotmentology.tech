import Link from "next/link";

import { EmployerSignalBlock } from "./employer-signal-block";

type CaseStudyCardProps = {
  href: string;
  title: string;
  summary: string;
  whatThisShows: string;
  ctaLabel: string;
};

export function CaseStudyCard({
  href,
  title,
  summary,
  whatThisShows,
  ctaLabel,
}: CaseStudyCardProps) {
  return (
    <article className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/45 p-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-100 sm:text-xl">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{summary}</p>
      </div>
      <EmployerSignalBlock text={whatThisShows} />
      <Link
        href={href}
        className="inline-block text-sm font-medium text-sky-400 hover:text-sky-300 hover:underline"
      >
        {ctaLabel}
      </Link>
    </article>
  );
}

import Link from "next/link";

type WritingCardProps = {
  href: string;
  title: string;
  summary: string;
  readingTime: string;
  publishedAt: string;
  category: string;
  tags: string[];
  seriesName?: string;
  seriesPart?: number;
};

export function WritingCard({
  href,
  title,
  summary,
  readingTime,
  publishedAt,
  category,
  tags,
  seriesName,
  seriesPart,
}: WritingCardProps) {
  const isSeries = Boolean(seriesName);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-zinc-950/50 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 ${
        isSeries
          ? "border-sky-500/25 hover:border-sky-500/40"
          : "border-zinc-800/90 hover:border-zinc-600/90"
      }`}
    >
      {isSeries ? (
        <div className="flex items-center justify-between gap-2 border-b border-sky-500/15 bg-sky-950/20 px-5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-400/90">
            {seriesName}
            {seriesPart ? ` · Part ${seriesPart}` : ""}
          </span>
          <span className="text-[10px] text-zinc-500">Essay</span>
        </div>
      ) : (
        <div className="h-1 w-full bg-gradient-to-r from-sky-600/40 via-sky-500/30 to-transparent" aria-hidden />
      )}
      <div className="flex flex-1 flex-col space-y-3 p-5">
        <p className="text-xs text-zinc-500">
          {category} · {publishedAt} · {readingTime}
        </p>
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-zinc-100">{title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-zinc-400">{summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-500"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition-colors hover:text-sky-300 hover:underline"
        >
          Read essay
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

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
  return (
    <article className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/45 p-5">
      <p className="text-xs text-zinc-500">
        {category} · {publishedAt} · {readingTime}
      </p>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{summary}</p>
      {seriesName ? (
        <p className="text-xs text-zinc-500">
          Series: {seriesName}
          {seriesPart ? ` (Part ${seriesPart})` : ""}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <Link
        href={href}
        className="inline-block text-sm font-medium text-sky-400 hover:text-sky-300 hover:underline"
      >
        Read article
      </Link>
    </article>
  );
}

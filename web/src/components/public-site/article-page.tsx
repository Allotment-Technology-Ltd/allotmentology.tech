import { RelatedReading } from "@/components/public-site/related-reading";
import { PublicNav } from "@/components/public-site/public-nav";
import { SeriesNavigation } from "@/components/public-site/series-navigation";
import type { ArticleEntry } from "@/lib/public-site/content";

type ArticlePageProps = {
  article: ArticleEntry;
  previousInSeriesHref?: string;
  nextInSeriesHref?: string;
};

export function ArticlePage({
  article,
  previousInSeriesHref,
  nextInSeriesHref,
}: ArticlePageProps) {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <article className="space-y-8">
        <header className="space-y-4 border-b border-zinc-800/80 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
            {article.section === "case-studies" ? "Case study" : "Writing"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            {article.title}
          </h1>
          {article.subtitle ? (
            <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
              {article.subtitle}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-zinc-400">{article.standfirst}</p>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>{article.publishedAt}</span>
            <span>·</span>
            <span>{article.readingTime}</span>
            <span>·</span>
            <span>{article.category}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="space-y-5 text-sm leading-relaxed text-zinc-300 sm:text-base">
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      {article.series ? (
        <SeriesNavigation
          seriesName={article.series.name}
          currentPart={article.series.part}
          totalParts={article.series.total}
          previousHref={previousInSeriesHref}
          nextHref={nextInSeriesHref}
        />
      ) : null}

      <RelatedReading
        relatedReading={article.relatedReading}
        relatedProducts={article.relatedProducts}
      />
    </main>
  );
}

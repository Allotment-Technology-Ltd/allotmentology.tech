import { Fragment } from "react";

import { PullQuote } from "@/components/public-site/pull-quote";
import { RelatedReading } from "@/components/public-site/related-reading";
import { PublicNav } from "@/components/public-site/public-nav";
import { SeriesNavigation } from "@/components/public-site/series-navigation";
import { WorkCrossLinks } from "@/components/public-site/work-cross-links";
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
    <main className="mx-auto w-full max-w-3xl space-y-12 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <article className="space-y-10">
        <header className="space-y-5 border-b border-zinc-800/80 pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
            {article.section === "case-studies" ? "Case study" : "Writing"}
          </p>
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-zinc-50 sm:text-4xl sm:leading-tight">
            {article.title}
          </h1>
          {article.subtitle ? (
            <p className="text-lg leading-relaxed text-zinc-300 sm:text-xl">{article.subtitle}</p>
          ) : null}
          <p className="border-l-2 border-zinc-700 pl-4 text-base leading-relaxed text-zinc-400">
            {article.standfirst}
          </p>
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

        <div className="space-y-6 text-[1.05rem] leading-[1.75] text-zinc-300 sm:text-lg sm:leading-[1.8]">
          {article.body.map((paragraph, index) => (
            <Fragment key={paragraph}>
              <p>{paragraph}</p>
              {index === 0 && article.pullQuote ? (
                <PullQuote quote={article.pullQuote} variant={article.section} />
              ) : null}
            </Fragment>
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

      <WorkCrossLinks
        caption={
          article.section === "case-studies"
            ? "Case studies are one thread; writing and products are others"
            : "Writing sits alongside case studies and products"
        }
      />
    </main>
  );
}

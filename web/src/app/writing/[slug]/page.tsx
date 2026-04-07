import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage } from "@/components/public-site/article-page";
import {
  getSeriesPosts,
  getWritingPostBySlug,
  writingPosts,
} from "@/lib/public-site/content";

export async function generateStaticParams() {
  return writingPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getWritingPostBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Writing`,
    description: article.metaDescription ?? article.summary,
  };
}

export default async function WritingPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getWritingPostBySlug(slug);
  if (!article) notFound();

  let previousInSeriesHref: string | undefined;
  let nextInSeriesHref: string | undefined;
  if (article.series) {
    const seriesPosts = getSeriesPosts(article.series.name);
    const idx = seriesPosts.findIndex((entry) => entry.slug === article.slug);
    const previous = idx > 0 ? seriesPosts[idx - 1] : null;
    const next = idx >= 0 && idx < seriesPosts.length - 1 ? seriesPosts[idx + 1] : null;
    previousInSeriesHref = previous ? `/writing/${previous.slug}` : undefined;
    nextInSeriesHref = next ? `/writing/${next.slug}` : undefined;
  }

  return (
    <ArticlePage
      article={article}
      previousInSeriesHref={previousInSeriesHref}
      nextInSeriesHref={nextInSeriesHref}
    />
  );
}

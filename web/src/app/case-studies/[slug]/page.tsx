import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage } from "@/components/public-site/article-page";
import { caseStudies, getCaseStudyBySlug } from "@/lib/public-site/content";

export async function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getCaseStudyBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Case Study`,
    description: article.metaDescription ?? article.summary,
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getCaseStudyBySlug(slug);
  if (!article) notFound();

  return <ArticlePage article={article} />;
}

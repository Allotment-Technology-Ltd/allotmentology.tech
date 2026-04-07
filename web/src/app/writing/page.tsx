import type { Metadata } from "next";

import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { WritingCard } from "@/components/public-site/writing-card";
import { writingPosts } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Writing — Allotment Works",
  description:
    "Long-form product essays and field notes on AI, systems, and delivery in complex environments.",
};

export default function WritingIndexPage() {
  const sorted = [...writingPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <SectionIntro
        heading="Writing"
        description="Essays and build notes on software, AI, and product work. This section is where method and reflection are documented in public."
      />
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-5 text-sm text-zinc-400">
        <p className="font-medium text-zinc-200">Featured series: AI Coding</p>
        <p className="mt-1 leading-relaxed">
          Three connected essays on AI-assisted software work: accountability,
          development cost, and what to preserve as tools improve.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((post) => (
          <WritingCard
            key={post.slug}
            href={`/writing/${post.slug}`}
            title={post.title}
            summary={post.summary}
            readingTime={post.readingTime}
            publishedAt={post.publishedAt}
            category={post.category}
            tags={post.tags}
            seriesName={post.series?.name}
            seriesPart={post.series?.part}
          />
        ))}
      </div>
    </main>
  );
}

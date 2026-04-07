import type { Metadata } from "next";

import { Reveal } from "@/components/public-site/motion/reveal";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { WorkCrossLinks } from "@/components/public-site/work-cross-links";
import { WritingCard } from "@/components/public-site/writing-card";
import { writingIndexIntro, writingPosts } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Writing — Adam Boon",
  description:
    "Essays by Adam Boon on AI-assisted software work, delivery economics, craft, and product method.",
};

export default function WritingIndexPage() {
  const sorted = [...writingPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <Reveal>
        <PublicNav />
      </Reveal>
      <Reveal delay={0.05}>
        <SectionIntro
          eyebrow={writingIndexIntro.eyebrow}
          heading={writingIndexIntro.heading}
          description={writingIndexIntro.description}
          accent="writing"
        />
      </Reveal>
      <Reveal>
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/25 to-zinc-950/40 p-6 text-sm text-zinc-400">
          <p className="font-medium text-sky-300/90">Series: AI Coding</p>
          <p className="mt-2 leading-relaxed">
            Three connected essays — legitimacy and guilt, shifted development economics, and what to
            preserve when generation gets fluent. Read in order or jump in where the question bites.
          </p>
        </div>
      </Reveal>
      <Reveal>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      </Reveal>

      <Reveal>
        <WorkCrossLinks caption="Case studies and products carry the same thread from different angles" />
      </Reveal>
    </main>
  );
}

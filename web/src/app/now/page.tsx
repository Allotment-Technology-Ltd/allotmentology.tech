import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/public-site/motion/reveal";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { nowPageIntro, nowPageSections, siteIdentity } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Now — Adam Boon",
  description:
    "Current focus, build themes, and the roles and collaborations Adam Boon is open to — based in Devon, UK.",
};

export default function NowPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-14 sm:px-10 sm:py-20">
      <Reveal>
        <PublicNav />
      </Reveal>
      <Reveal delay={0.05}>
        <SectionIntro
          eyebrow={`${siteIdentity.name} · ${siteIdentity.location}`}
          heading="Now"
          description="What I am paying attention to at the moment — work, builds, and the shape of opportunities that make sense."
        />
      </Reveal>

      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-5 sm:p-6">
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden />
          <p className="relative text-sm leading-relaxed text-zinc-300 sm:text-base">{nowPageIntro}</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="space-y-10">
          {nowPageSections.map((section) => (
            <section
              key={section.title}
              className="space-y-4 rounded-2xl border border-zinc-800/60 bg-zinc-950/25 p-5 sm:p-6"
            >
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{section.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-8 text-sm">
        <Link href="/case-studies" className="text-sky-400 hover:text-sky-300 hover:underline">
          Case studies
        </Link>
        <Link href="/writing" className="text-sky-400 hover:text-sky-300 hover:underline">
          Writing
        </Link>
        <Link href="/about" className="text-sky-400 hover:text-sky-300 hover:underline">
          About
        </Link>
        <Link href="/contact" className="text-sky-400 hover:text-sky-300 hover:underline">
          Contact
        </Link>
        </div>
      </Reveal>
    </main>
  );
}

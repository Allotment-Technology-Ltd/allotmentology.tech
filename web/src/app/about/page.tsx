import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/public-site/motion/reveal";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import {
  aboutPageLead,
  aboutPageSections,
  products,
  siteIdentity,
} from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "About — Adam Boon",
  description:
    "Adam Boon, Devon, UK: NHS and public-service product leadership, independent products, and how the two reinforce each other.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-14 sm:px-10 sm:py-20">
      <Reveal>
        <PublicNav />
      </Reveal>
      <Reveal delay={0.05}>
        <SectionIntro
          eyebrow={`${siteIdentity.name} · ${siteIdentity.location}`}
          heading="About"
          description="Background, practice, and the bridge between institution-scale delivery and independent building."
        />
      </Reveal>

      <Reveal>
        <p className="text-base leading-relaxed text-zinc-200 sm:text-lg">{aboutPageLead}</p>
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap gap-2">
          {aboutPageSections.map((section) => (
            <span
              key={section.title}
              className="rounded-full border border-zinc-700/80 bg-zinc-950/50 px-3 py-1 text-xs font-medium text-zinc-400"
            >
              {section.title}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="space-y-10">
          {aboutPageSections.map((section) => (
            <section key={section.title} className="space-y-4 border-l-2 border-zinc-800 pl-5">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{section.title}</h2>
              <div className="space-y-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="space-y-3 rounded-2xl border border-zinc-800/90 bg-zinc-950/35 p-6">
        <p className="text-sm font-medium text-zinc-200">Explore the work</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
          <li>
            <Link href="/case-studies" className="text-sky-400 hover:text-sky-300 hover:underline">
              Case studies
            </Link>
          </li>
          <li>
            <Link href="/writing" className="text-sky-400 hover:text-sky-300 hover:underline">
              Writing
            </Link>
          </li>
          <li>
            <Link href="/now" className="text-sky-400 hover:text-sky-300 hover:underline">
              Now
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-sky-400 hover:text-sky-300 hover:underline">
              Contact
            </Link>
          </li>
        </ul>
        <p className="text-sm font-medium text-zinc-200 pt-2">Products</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
          {products.map((p) => (
            <li key={p.id}>
              <a href={p.href} className="text-sky-400 hover:text-sky-300 hover:underline">
                {p.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-zinc-200 pt-2">Elsewhere</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
          <li>
            <a
              href={siteIdentity.githubUrl}
              className="text-sky-400 hover:text-sky-300 hover:underline"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href={`mailto:${siteIdentity.email}?subject=CV%20request`}
              className="text-sky-400 hover:text-sky-300 hover:underline"
            >
              Request CV
            </a>
          </li>
        </ul>
        </div>
      </Reveal>
    </main>
  );
}

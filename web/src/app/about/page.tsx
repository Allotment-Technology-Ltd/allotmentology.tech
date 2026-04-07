import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { aboutLong } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "About — Allotment Works",
  description:
    "Background and product leadership profile across NHS/public-service delivery and independent product execution.",
};

export default function AboutPage() {
  const paragraphs = aboutLong.split("\n\n");

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <SectionIntro
        heading="About"
        description="A product leadership profile grounded in evidence, delivery, and thoughtful systems work."
      />
      <div className="space-y-5 text-sm leading-relaxed text-zinc-300 sm:text-base">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href="/case-studies"
          className="text-sky-400 hover:text-sky-300 hover:underline"
        >
          View case studies
        </Link>
        <Link
          href="/contact"
          className="text-sky-400 hover:text-sky-300 hover:underline"
        >
          Contact
        </Link>
      </div>
    </main>
  );
}

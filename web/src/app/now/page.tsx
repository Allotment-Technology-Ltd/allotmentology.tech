import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { nowContent } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Now — Allotment Works",
  description: "Current focus and role alignment.",
};

export default function NowPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <SectionIntro
        heading="Now"
        description="Current focus areas and the type of senior role I am open to."
      />
      <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
        {nowContent}
      </p>
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

import type { Metadata } from "next";

import { CaseStudyCard } from "@/components/public-site/case-study-card";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { caseStudies } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Case Studies — Allotment Works",
  description: "Selected case studies spanning cyber, NHS triage, and service improvement.",
};

export default function CaseStudiesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <PublicNav />
      <SectionIntro
        heading="Case studies"
        description="Reflective delivery essays from NHS and public-service product environments. Each piece focuses on decisions, constraints, and practical outcomes."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {caseStudies.map((study) => (
          <CaseStudyCard
            key={study.slug}
            href={`/case-studies/${study.slug}`}
            title={study.title}
            summary={study.summary}
            whatThisShows={study.whatThisShows ?? "Shows applied product judgment under real constraints."}
            ctaLabel={study.ctaLabel ?? "Read case study"}
          />
        ))}
      </div>
    </main>
  );
}

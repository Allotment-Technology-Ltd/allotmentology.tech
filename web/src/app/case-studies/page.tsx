import type { Metadata } from "next";

import { CaseStudyCard } from "@/components/public-site/case-study-card";
import { Reveal } from "@/components/public-site/motion/reveal";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { WorkCrossLinks } from "@/components/public-site/work-cross-links";
import { caseStudies, caseStudiesIndexIntro } from "@/lib/public-site/content";

export const metadata: Metadata = {
  title: "Case studies — Adam Boon",
  description:
    "NHS and public-service product case studies by Adam Boon: cyber redesign, migration, and clinical triage.",
};

export default function CaseStudiesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-14 sm:px-10 sm:py-20">
      <Reveal>
        <PublicNav />
      </Reveal>
      <Reveal delay={0.05}>
        <SectionIntro
          eyebrow={caseStudiesIndexIntro.eyebrow}
          heading={caseStudiesIndexIntro.heading}
          description={caseStudiesIndexIntro.description}
          accent="cases"
        />
      </Reveal>
      <Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {caseStudies.map((study) => (
            <CaseStudyCard
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              title={study.title}
              summary={study.summary}
              category={study.category}
              whatThisShows={study.whatThisShows ?? "Shows applied product judgment under real constraints."}
              ctaLabel={study.ctaLabel ?? "Read case study"}
            />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <WorkCrossLinks caption="Writing and products extend the same questions in other forms" />
      </Reveal>
    </main>
  );
}

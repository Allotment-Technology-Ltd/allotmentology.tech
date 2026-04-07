import Link from "next/link";
import { redirect } from "next/navigation";

import { AboutPreview } from "@/components/public-site/about-preview";
import { CaseStudyCard } from "@/components/public-site/case-study-card";
import { ContactCTA } from "@/components/public-site/contact-cta";
import { ExperienceSummary } from "@/components/public-site/experience-summary";
import { HeroSection } from "@/components/public-site/hero-section";
import { NarrativeBridge } from "@/components/public-site/narrative-bridge";
import { Reveal } from "@/components/public-site/motion/reveal";
import { NowSection } from "@/components/public-site/now-section";
import { ProductCard } from "@/components/public-site/product-card";
import { PublicNav } from "@/components/public-site/public-nav";
import { SectionIntro } from "@/components/public-site/section-intro";
import { WritingCard } from "@/components/public-site/writing-card";
import {
  requireSessionAppUserOrRedirect,
  resolveAppHomePath,
} from "@/lib/auth/access-control.server";
import { isNeonAuthConfigured } from "@/lib/auth/auth-config";
import { getAuthServer } from "@/lib/auth/server";
import {
  aboutShort,
  caseStudies,
  contactContent,
  employerRelevance,
  experienceSummary,
  featuredCaseStudySlugs,
  featuredWritingSlugs,
  heroContent,
  nowContent,
  products,
  productsIntro,
  writingPosts,
} from "@/lib/public-site/content";

export const dynamic = "force-dynamic";

async function redirectSignedInUsers() {
  if (!isNeonAuthConfigured()) return;
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) return;
  const appUser = await requireSessionAppUserOrRedirect();
  redirect(resolveAppHomePath(appUser.approvalStatus));
}

export default async function MarketingHomePage() {
  await redirectSignedInUsers();
  const featuredCaseStudies = caseStudies.filter((study) =>
    featuredCaseStudySlugs.includes(study.slug as (typeof featuredCaseStudySlugs)[number]),
  );
  const featuredWriting = writingPosts.filter((post) =>
    featuredWritingSlugs.includes(post.slug as (typeof featuredWritingSlugs)[number]),
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-16 px-6 py-14 sm:space-y-24 sm:px-10 sm:py-20">
      <Reveal>
        <PublicNav />
      </Reveal>
      <Reveal delay={0.05}>
        <HeroSection content={heroContent} />
      </Reveal>

      <Reveal>
        <NarrativeBridge />
      </Reveal>

      <Reveal>
        <section id="selected-products" className="scroll-mt-24 space-y-8">
          <SectionIntro
            heading="Selected products"
            description={productsIntro}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-6">
          <SectionIntro
            heading={employerRelevance.heading}
            description={employerRelevance.intro}
          />
          <ul className="grid gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-950/35 p-6 text-sm leading-relaxed text-zinc-400 sm:grid-cols-2">
            {employerRelevance.points.map((point) => (
              <li
                key={point}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 transition-colors hover:border-zinc-700/90"
              >
                {point}
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <ExperienceSummary
          heading={experienceSummary.heading}
          body={experienceSummary.body}
        />
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionIntro
            heading="Selected case studies"
            description="Three delivery essays from NHS and national contexts — cyber redesign, live migration, and clinically weighted triage. Each is written to show judgment, not vanity metrics."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCaseStudies.map((study) => (
              <CaseStudyCard
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                title={study.title}
                summary={study.summary}
                category={study.category}
                whatThisShows={study.whatThisShows ?? "Shows applied product judgment under constraints."}
                ctaLabel={study.ctaLabel ?? "Read case study"}
              />
            ))}
          </div>
          <Link
            href="/case-studies"
            className="inline-block text-sm font-medium text-sky-400 transition-colors hover:text-sky-300 hover:underline"
          >
            Browse all case studies →
          </Link>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionIntro
            heading="Selected writing"
            description="The full AI Coding trilogy: public essays on assisted software work, real cost shifts, and what still deserves human depth. Written as method on the record."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredWriting.map((post) => (
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
          <Link
            href="/writing"
            className="inline-block text-sm font-medium text-sky-400 transition-colors hover:text-sky-300 hover:underline"
          >
            Browse all writing →
          </Link>
        </section>
      </Reveal>

      <Reveal>
        <AboutPreview text={aboutShort} />
      </Reveal>
      <Reveal>
        <NowSection text={nowContent} />
      </Reveal>
      <Reveal>
        <ContactCTA
          body={contactContent.body}
          links={[contactContent.email, contactContent.github, contactContent.cv]}
        />
      </Reveal>
    </main>
  );
}

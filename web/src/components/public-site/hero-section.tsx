import { HeroComposition } from "@/components/public-site/hero-composition";

type HeroSectionProps = {
  content: {
    eyebrow: string;
    name: string;
    location: string;
    headline: string;
    subheading: string;
    supporting: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800/80 pb-14 sm:pb-16">
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[min(70vw,520px)] w-[min(90vw,520px)] rounded-full bg-sky-500/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(60vw,420px)] w-[min(80vw,420px)] rounded-full bg-zinc-400/[0.04] blur-3xl"
        aria-hidden
      />
      <div
        className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />
      <HeroComposition content={content} />
    </section>
  );
}

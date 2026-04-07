import Link from "next/link";

type HeroSectionProps = {
  content: {
    eyebrow: string;
    headline: string;
    subheading: string;
    supporting: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="space-y-6 border-b border-zinc-800/80 pb-12 sm:pb-14">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {content.eyebrow}
      </p>
      <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
        {content.headline}
      </h1>
      <p className="max-w-3xl text-base leading-relaxed text-zinc-300 sm:text-lg">
        {content.subheading}
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        {content.supporting}
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href={content.primaryCta.href}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          {content.primaryCta.label}
        </Link>
        <Link
          href={content.secondaryCta.href}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
        >
          {content.secondaryCta.label}
        </Link>
      </div>
    </section>
  );
}

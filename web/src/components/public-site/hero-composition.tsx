"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";

import { ProductVisual, type ProductVisualId } from "@/components/public-site/product-visual";

type HeroContent = {
  eyebrow: string;
  name: string;
  location: string;
  headline: string;
  subheading: string;
  supporting: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

const collage: {
  id: ProductVisualId;
  label: string;
  href: string;
  position: string;
  rotate: number;
  delay: number;
}[] = [
  {
    id: "restormel",
    label: "Restormel",
    href: "https://restormel.dev",
    position: "left-0 top-0 w-[min(100%,210px)]",
    rotate: -6,
    delay: 0.1,
  },
  {
    id: "sophia",
    label: "SOPHIA",
    href: "https://usesophia.app",
    position: "right-0 top-[26%] w-[min(100%,200px)]",
    rotate: 5,
    delay: 0.2,
  },
  {
    id: "plot",
    label: "PLOT",
    href: "https://plotbudget.com",
    position: "left-[8%] bottom-0 w-[min(100%,205px)]",
    rotate: -4,
    delay: 0.3,
  },
];

export function HeroComposition({ content }: { content: HeroContent }) {
  return (
    <MotionConfig reducedMotion="user">
    <div className="relative z-[1] grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:items-center lg:gap-14">
      <div className="space-y-6">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {content.eyebrow}
        </motion.p>
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-lg font-medium tracking-tight text-zinc-100 sm:text-xl">{content.name}</p>
          <p className="text-sm text-zinc-500 sm:text-base">{content.location}</p>
        </motion.div>
        <motion.h1
          className="max-w-3xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {content.headline}
        </motion.h1>
        <motion.p
          className="max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          {content.subheading}
        </motion.p>
        <motion.p
          className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {content.supporting}
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-3 pt-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={content.primaryCta.href}
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
          >
            {content.primaryCta.label}
          </Link>
          <Link
            href={content.secondaryCta.href}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900/80"
          >
            {content.secondaryCta.label}
          </Link>
          <Link
            href="#selected-products"
            className="rounded-md px-2 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            See products ↓
          </Link>
        </motion.div>
      </div>

      <div className="relative mx-auto w-full max-w-[380px] lg:mx-0 lg:max-w-none">
        <div className="relative h-[min(72vw,380px)] min-h-[280px] sm:h-[360px]">
          <div
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500/10 via-transparent to-zinc-500/10 blur-3xl"
            aria-hidden
          />
          {collage.map((item) => (
            <motion.a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={`absolute shadow-2xl shadow-black/45 ${item.position}`}
              initial={{ opacity: 0, scale: 0.94, y: 16, rotate: item.rotate }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: item.rotate }}
              transition={{ duration: 0.55, delay: item.delay, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04, transition: { duration: 0.22 } }}
            >
              <span className="sr-only">{item.label}</span>
              <ProductVisual id={item.id} productName={item.label} compact className="w-full" />
              <span className="mt-1 block text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {item.label}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}

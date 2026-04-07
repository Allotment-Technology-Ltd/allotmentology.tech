"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type SeriesNavigationProps = {
  seriesName: string;
  currentPart: number;
  totalParts: number;
  previousHref?: string;
  nextHref?: string;
};

export function SeriesNavigation({
  seriesName,
  currentPart,
  totalParts,
  previousHref,
  nextHref,
}: SeriesNavigationProps) {
  return (
    <motion.div
      className="rounded-2xl border border-sky-500/20 bg-sky-950/15 p-6"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      reducedMotion="user"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-400/90">
          {seriesName}
        </span>
        <span className="text-xs text-zinc-500">
          Part {currentPart} of {totalParts}
        </span>
        <div className="ml-auto flex h-1.5 flex-1 gap-1 sm:max-w-[200px]">
          {Array.from({ length: totalParts }, (_, i) => (
            <span
              key={i}
              className={`h-full flex-1 rounded-full ${i < currentPart ? "bg-sky-500/50" : "bg-zinc-800"}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {previousHref ? (
          <Link
            href={previousHref}
            className="rounded-md border border-zinc-700 px-4 py-2 text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900/80"
          >
            ← Previous part
          </Link>
        ) : null}
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-md bg-zinc-100 px-4 py-2 font-medium text-zinc-900 transition-colors hover:bg-white"
          >
            Next part →
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}

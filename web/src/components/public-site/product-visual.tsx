"use client";

import Image from "next/image";

export type ProductVisualId = "restormel" | "sophia" | "plot";

type ProductVisualProps = {
  id: ProductVisualId;
  /** Optional real screenshot in /public (see public/site/products/README.md). */
  screenshotSrc?: string;
  productName: string;
  className?: string;
  /** Smaller composition for hero collage */
  compact?: boolean;
};

function RestormelSvg({ compact, uid }: { compact?: boolean; uid: string }) {
  const h = compact ? 120 : 180;
  const w = compact ? 200 : 320;
  const mid = `mk-${uid}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden
    >
      <rect width={w} height={h} rx="10" className="fill-zinc-900/90" />
      <rect x="12" y="12" width={w - 24} height="28" rx="4" className="fill-zinc-800/80" />
      <rect x="12" y="48" width={(w - 28) / 3} height={h - 60} rx="4" className="fill-zinc-800/60" />
      <rect x={12 + (w - 28) / 3 + 4} y="48" width={(w - 28) / 3} height={h - 60} rx="4" className="fill-sky-950/50 stroke-sky-500/30" strokeWidth="1" />
      <rect x={12 + ((w - 28) / 3 + 4) * 2} y="48" width={(w - 28) / 3} height={h - 60} rx="4" className="fill-zinc-800/60" />
      <text
        x={w / 2}
        y="30"
        textAnchor="middle"
        fill="#71717a"
        style={{ fontSize: compact ? 7 : 9, fontFamily: "ui-monospace, monospace" }}
      >
        App / policy / providers
      </text>
      <path
        d={`M ${w / 2} 76 L ${w / 2} 88`}
        stroke="rgba(56,189,248,0.35)"
        strokeWidth="1.5"
        markerEnd={`url(#${mid})`}
      />
      <defs>
        <marker id={mid} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <circle r="1.5" fill="rgba(56,189,248,0.45)" />
        </marker>
      </defs>
    </svg>
  );
}

function SophiaSvg({ compact }: { compact?: boolean }) {
  const h = compact ? 120 : 180;
  const w = compact ? 200 : 320;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} fill="none" className="h-full w-full" aria-hidden>
      <rect width={w} height={h} rx="10" className="fill-zinc-900/90" />
      <rect x="16" y="14" width={w - 32} height="52" rx="6" className="fill-zinc-800/70" />
      <rect x="24" y="24" width={w - 48} height="8" rx="2" className="fill-zinc-600/50" />
      <rect x="24" y="38" width={(w - 48) * 0.65} height="8" rx="2" className="fill-zinc-600/35" />
      <rect x="16" y="76" width={(w - 32) * 0.55} height={h - 92} rx="6" className="fill-emerald-950/30 stroke-emerald-500/20" strokeWidth="1" />
      <rect x={16 + (w - 32) * 0.55 + 8} y="76" width={(w - 32) * 0.45 - 8} height={h - 92} rx="6" className="fill-zinc-800/50" />
      <circle cx={w - 28} cy="44" r="10" className="fill-sky-500/15 stroke-sky-400/30" strokeWidth="1" />
      <text x="20" y="98" fill="#71717a" style={{ fontSize: compact ? 7 : 8 }}>
        Inquiry
      </text>
      <text x={16 + (w - 32) * 0.55 + 14} y="98" fill="#71717a" style={{ fontSize: compact ? 7 : 8 }}>
        Feedback
      </text>
    </svg>
  );
}

function PlotSvg({ compact }: { compact?: boolean }) {
  const h = compact ? 120 : 180;
  const w = compact ? 200 : 320;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} fill="none" className="h-full w-full" aria-hidden>
      <rect width={w} height={h} rx="10" className="fill-zinc-900/90" />
      <rect x="14" y="14" width={w - 28} height="36" rx="6" className="fill-zinc-800/80" />
      <text x="22" y="36" fill="#a1a1aa" style={{ fontSize: compact ? 9 : 11 }}>
        Household
      </text>
      <path
        d={`M 24 ${h - 36} Q ${w / 2} ${h - 70} ${w - 24} ${h - 50}`}
        className="stroke-amber-500/35"
        strokeWidth="2"
        fill="none"
      />
      <rect x="24" y={h - 42} width="12" height="12" rx="2" className="fill-amber-500/25" />
      <rect x="44" y={h - 40} width="40" height="8" rx="2" className="fill-zinc-600/40" />
      <rect x="24" y={h - 62} width="8" height="8" rx="2" className="fill-zinc-600/30" />
      <rect x="40" y={h - 64} width="32" height="10" rx="2" className="fill-zinc-600/25" />
    </svg>
  );
}

function SvgForId({ id, compact }: { id: ProductVisualId; compact?: boolean }) {
  switch (id) {
    case "restormel":
      return <RestormelSvg compact={compact} uid="restormel" />;
    case "sophia":
      return <SophiaSvg compact={compact} />;
    case "plot":
      return <PlotSvg compact={compact} />;
    default:
      return null;
  }
}

export function ProductVisual({
  id,
  screenshotSrc,
  productName,
  className = "",
  compact,
}: ProductVisualProps) {
  const frame = `overflow-hidden rounded-lg border border-zinc-800/90 bg-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ring-1 ring-white/5 ${className}`;

  if (screenshotSrc) {
    return (
      <div className={frame}>
        <Image
          src={screenshotSrc}
          alt={`${productName} product interface`}
          width={640}
          height={400}
          className="h-auto w-full object-cover object-top"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
    );
  }

  return (
    <div className={`${frame} aspect-[16/10] ${compact ? "max-h-[120px]" : ""}`}>
      <div className="flex h-full w-full items-center justify-center p-1">
        <SvgForId id={id} compact={compact} />
      </div>
    </div>
  );
}

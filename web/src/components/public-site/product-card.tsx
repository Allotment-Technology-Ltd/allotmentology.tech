import { EmployerSignalBlock } from "./employer-signal-block";
import { ProductVisual } from "./product-visual";

import type { ProductEntry } from "@/lib/public-site/content";

export function ProductCard({ product }: { product: ProductEntry }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/50 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20">
      <div className="relative border-b border-zinc-800/80 bg-zinc-900/30 p-3">
        <ProductVisual
          id={product.visualId}
          productName={product.name}
          screenshotSrc={product.screenshotSrc}
          className="w-full"
        />
      </div>
      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-100">{product.name}</h3>
          <p className="text-xs font-medium leading-snug text-sky-400/90">{product.tagline}</p>
          <p className="text-sm leading-relaxed text-zinc-400">{product.description}</p>
        </div>
        <EmployerSignalBlock text={product.employerSignal} />
        <a
          href={product.href}
          className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition-colors hover:text-sky-300 hover:underline"
        >
          Open site
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            ↗
          </span>
        </a>
      </div>
    </article>
  );
}

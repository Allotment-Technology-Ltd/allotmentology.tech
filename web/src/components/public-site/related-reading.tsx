import Link from "next/link";

import { getArticleByPath, products } from "@/lib/public-site/content";

type RelatedReadingProps = {
  relatedReading: string[];
  relatedProducts: Array<(typeof products)[number]["id"]>;
};

export function RelatedReading({ relatedReading, relatedProducts }: RelatedReadingProps) {
  const productLinks = products.filter((p) => relatedProducts.includes(p.id));
  const relatedArticles = relatedReading.map((href) => ({
    href,
    title: getArticleByPath(href)?.title ?? href.replace("/", ""),
    section: getArticleByPath(href)?.section,
  }));

  return (
    <div
      className={`grid gap-6 ${productLinks.length > 0 ? "lg:grid-cols-2" : ""}`}
    >
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Related reading</p>
        <ul className="mt-4 space-y-3">
          {relatedArticles.map((article) => (
            <li key={article.href}>
              <Link
                href={article.href}
                className="group block rounded-lg border border-transparent px-0 py-1 transition-colors hover:border-zinc-800/80 hover:bg-zinc-900/40"
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  {article.section === "case-studies" ? "Case study" : "Writing"}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-zinc-200 group-hover:text-white">
                  {article.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {productLinks.length > 0 ? (
        <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-950/60 to-sky-950/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Products in this thread
          </p>
          <ul className="mt-4 space-y-3">
            {productLinks.map((product) => (
              <li key={product.id}>
                <a
                  href={product.href}
                  className="group flex flex-col rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-4 py-3 transition-colors hover:border-sky-500/25 hover:bg-zinc-900/50"
                >
                  <span className="text-sm font-medium text-zinc-100">{product.name}</span>
                  <span className="mt-1 text-xs text-zinc-500">{product.tagline}</span>
                  <span className="mt-2 text-xs text-sky-400/90 group-hover:underline">Open site ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

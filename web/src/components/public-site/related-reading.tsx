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
  }));

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/35 p-5">
      <div>
        <p className="text-sm font-medium text-zinc-200">Related reading</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {relatedArticles.map((article) => (
            <li key={article.href}>
              <Link
                href={article.href}
                className="text-zinc-300 hover:text-zinc-100 hover:underline"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">Related products</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {productLinks.map((product) => (
            <li key={product.id}>
              <a
                href={product.href}
                className="text-zinc-300 hover:text-zinc-100 hover:underline"
              >
                {product.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

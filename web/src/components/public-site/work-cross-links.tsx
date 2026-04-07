import Link from "next/link";

import { workCrossLinks } from "@/lib/public-site/content";

type WorkCrossLinksProps = {
  /** Extra context shown above the link row. */
  caption?: string;
};

export function WorkCrossLinks({ caption = "More on this site" }: WorkCrossLinksProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-6">
      <p className="text-sm font-medium text-zinc-200">{caption}</p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
        {workCrossLinks.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-zinc-300 hover:text-zinc-100 hover:underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";

import { siteIdentity } from "@/lib/public-site/content";

const links = [
  { href: "/", label: "Home" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/writing", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/now", label: "Now" },
  { href: "/contact", label: "Contact" },
] as const;

export function PublicNav() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        {siteIdentity.name} · {siteIdentity.location}
      </p>
      <nav className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-2 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-1.5 text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-50"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

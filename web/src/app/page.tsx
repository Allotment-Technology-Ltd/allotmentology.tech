import Link from "next/link";
import { redirect } from "next/navigation";

import {
  requireSessionAppUserOrRedirect,
  resolveAppHomePath,
} from "@/lib/auth/access-control.server";
import { isNeonAuthConfigured } from "@/lib/auth/auth-config";
import { getAuthServer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

async function redirectSignedInUsers() {
  if (!isNeonAuthConfigured()) return;
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) return;
  const appUser = await requireSessionAppUserOrRedirect();
  redirect(resolveAppHomePath(appUser.approvalStatus));
}

const products = [
  {
    name: "Restormel Keys",
    href: "https://restormel.dev",
    tagline: "BYOK control layer for AI apps",
    summary:
      "Library-first routing, fallback policy, and model governance that sits above your existing AI gateway stack.",
    whatEmployersNotice:
      "Multi-framework SDK design, CLI/CI safety checks, and clear product-layer architecture thinking.",
  },
  {
    name: "SOPHIA",
    href: "https://usesophia.app",
    tagline: "Guided philosophy learning and dialectical inquiry",
    summary:
      "Structured learning, inquiry workflows, and feedback loops that combine pedagogy and AI-assisted reasoning.",
    whatEmployersNotice:
      "Strong product packaging, tier design, and domain-specific AI UX for education.",
  },
  {
    name: "PLOT",
    href: "https://plotbudget.com",
    tagline: "Privacy-first household operating system",
    summary:
      "A modular household platform starting with budgeting and rituals, designed around shared ownership instead of tracking.",
    whatEmployersNotice:
      "Privacy-by-default product choices, coherent roadmap execution, and consumer product sensibility.",
  },
] as const;

export default async function MarketingHomePage() {
  await redirectSignedInUsers();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10 sm:py-20">
      <section className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Allotment Technology
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Founder-built software across AI infrastructure, education, and
          privacy-first consumer products.
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-zinc-400">
          This showcase highlights live products I design and ship end-to-end.
          If you are evaluating me as a potential hire, start with the product
          cards below for architecture choices, execution style, and market
          clarity.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/auth/sign-in"
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Request account
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.name}
            className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-5"
          >
            <p className="text-sm text-zinc-500">{product.tagline}</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">
              {product.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {product.summary}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              <span className="font-medium text-zinc-300">Employer signal:</span>{" "}
              {product.whatEmployersNotice}
            </p>
            <a
              href={product.href}
              className="mt-4 inline-block text-sm font-medium text-sky-400 hover:text-sky-300 hover:underline"
            >
              Visit product
            </a>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-950/35 p-6">
        <h2 className="text-lg font-medium text-zinc-100">
          What this says about how I work
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
          <li>
            I build reusable systems, then prove them inside real products.
          </li>
          <li>
            I pair technical depth (SDKs, auth, data modeling) with clear product
            positioning.
          </li>
          <li>
            I bias toward shippable, measurable outcomes over presentation-only
            prototypes.
          </li>
        </ul>
      </section>
    </main>
  );
}

import { z } from "zod";

import { isTavilyConfigured } from "@/lib/funding-search/tavily";

import { listFundingDiscoveryBriefs } from "../funding-discovery-briefs-actions";
import { FundingDiscoveryClient } from "./funding-discovery-client";

export const dynamic = "force-dynamic";

export default async function DiscoverFundingPage({
  searchParams,
}: {
  searchParams: Promise<{ brief?: string }>;
}) {
  const sp = await searchParams;
  const tavilyConfigured = isTavilyConfigured();
  const { briefs: savedBriefs, loadError: briefsLoadError } =
    await listFundingDiscoveryBriefs();
  const initialBriefId =
    sp.brief && z.string().uuid().safeParse(sp.brief).success ? sp.brief : null;
  const initialBrief =
    initialBriefId == null
      ? null
      : (savedBriefs.find((b) => b.id === initialBriefId) ?? null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Discover funding
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Mitchell searches the public web (via Tavily), enriches top hits with fetched page text when
          possible, then turns results into draft opportunities. Save briefs to re-run or open{" "}
          <code className="rounded bg-zinc-900 px-1 text-zinc-300">
            /opportunities/discover?brief=&lt;id&gt;
          </code>{" "}
          from a bookmark.
        </p>
      </div>

      <FundingDiscoveryClient
        key={initialBriefId ?? "none"}
        tavilyConfigured={tavilyConfigured}
        briefsLoadError={briefsLoadError}
        savedBriefs={savedBriefs}
        initialBrief={
          initialBrief
            ? {
                id: initialBrief.id,
                label: initialBrief.label,
                briefText: initialBrief.briefText,
              }
            : null
        }
      />
    </div>
  );
}

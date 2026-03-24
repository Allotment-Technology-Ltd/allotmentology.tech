import "server-only";

export { isTavilyConfigured } from "./tavily-env";

export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

/**
 * Web search via Tavily (https://tavily.com). Set `TAVILY_API_KEY` in the server environment.
 */

export async function searchTavily(query: string): Promise<TavilySearchResult[]> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) {
    throw new Error("TAVILY_API_KEY is not set.");
  }
  const q = query.trim();
  if (!q) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query: q,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Tavily HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  let data: { results?: unknown };
  try {
    data = JSON.parse(text) as { results?: unknown };
  } catch {
    throw new Error("Tavily returned invalid JSON.");
  }

  const raw = Array.isArray(data.results) ? data.results : [];
  const out: TavilySearchResult[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url.startsWith("http")) continue;
    out.push({
      title: typeof o.title === "string" ? o.title : "",
      url,
      content: typeof o.content === "string" ? o.content : "",
      score: typeof o.score === "number" ? o.score : undefined,
    });
  }
  return out;
}

export function normalizeResultUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.href;
  } catch {
    return url.trim();
  }
}

/** Merge multiple Tavily result lists, deduped by normalized URL (best score kept). */
export function mergeTavilyResults(
  batches: TavilySearchResult[][],
): TavilySearchResult[] {
  const map = new Map<string, TavilySearchResult>();
  for (const batch of batches) {
    for (const r of batch) {
      const key = normalizeResultUrl(r.url);
      const prev = map.get(key);
      const score = r.score ?? 0;
      const prevScore = prev?.score ?? 0;
      if (!prev || score >= prevScore) {
        map.set(key, { ...r, url: key });
      }
    }
  }
  return [...map.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

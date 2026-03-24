import "server-only";

import type { TavilyResultInput } from "@/lib/ai/skills/mitchell-funding-discovery";
import { fetchGrantPagePlainText } from "@/lib/grant-url/fetch-page-text";

import type { TavilySearchResult } from "./tavily";

/** Top N search hits get a second-pass HTML→text fetch for richer Mitchell context. */
const MAX_PAGES_TO_FETCH = 6;
const EXCERPT_CHARS = 9000;
const FETCH_CONCURRENCY = 3;

async function mapInChunks<T, R>(
  items: T[],
  chunkSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

/**
 * For the highest-ranked Tavily rows, fetch each public page and append a plain-text excerpt.
 * Failures keep the original snippet and record why (model still sees the Tavily text).
 */
export async function enrichTavilyResultsWithFetchedPages(
  merged: TavilySearchResult[],
): Promise<TavilyResultInput[]> {
  const top = merged.slice(0, MAX_PAGES_TO_FETCH);
  const rest = merged.slice(MAX_PAGES_TO_FETCH);

  const enrichedTop = await mapInChunks(top, FETCH_CONCURRENCY, async (r) => {
    const fetched = await fetchGrantPagePlainText(r.url);
    let content = r.content;
    if (fetched.ok) {
      content =
        r.content +
        "\n\n--- Fetched page text (excerpt; verify on the live site) ---\n" +
        fetched.text.slice(0, EXCERPT_CHARS);
    } else {
      content =
        r.content +
        `\n\n[Full page fetch failed: ${fetched.error}. Using search snippet only.]`;
    }
    return {
      title: r.title,
      url: r.url,
      content,
      score: r.score,
    } satisfies TavilyResultInput;
  });

  const restMapped: TavilyResultInput[] = rest.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));

  return [...enrichedTop, ...restMapped];
}

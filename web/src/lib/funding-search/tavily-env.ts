/**
 * Tavily env check only (no `server-only` / fetch). Safe for Server Components.
 */
export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

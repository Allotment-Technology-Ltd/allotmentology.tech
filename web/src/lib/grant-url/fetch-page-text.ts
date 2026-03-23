import "server-only";

const MAX_BYTES = 512 * 1024;
const MAX_TEXT_CHARS = 120_000;

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

export type FetchPageTextResult =
  | { ok: true; text: string; finalUrl: string }
  | { ok: false; error: string };

/**
 * Fetch a public funding page and return plain text for AI extraction.
 * Best-effort; does not execute JavaScript (SPAs may return shell HTML only).
 */
export async function fetchGrantPagePlainText(url: string): Promise<FetchPageTextResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http(s) URLs are allowed." };
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20_000);
  try {
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "User-Agent":
          "AllotmentFundingOps/1.0 (+https://allotment.works; grant URL enrichment)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(t);

    if (!res.ok) {
      return {
        ok: false,
        error: `Page returned HTTP ${res.status}.`,
      };
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml|text\/plain/i.test(ct) && !ct.includes("octet-stream")) {
      return {
        ok: false,
        error:
          "Unexpected content type (expected HTML). The URL may point to a PDF or binary file.",
      };
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return { ok: false, error: "Page is too large to process safely." };
    }

    const decoder = new TextDecoder("utf-8", { fatal: false });
    const raw = decoder.decode(buf);
    const text = htmlToPlainText(raw);
    if (text.length < 80) {
      return {
        ok: false,
        error:
          "Very little text was extracted. The page may require JavaScript or block automated access.",
      };
    }

    return {
      ok: true,
      text,
      finalUrl: res.url,
    };
  } catch (e) {
    clearTimeout(t);
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "Request timed out." };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not fetch the URL.",
    };
  }
}

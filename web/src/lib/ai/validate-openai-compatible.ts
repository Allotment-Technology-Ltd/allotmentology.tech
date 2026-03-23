import "server-only";

/**
 * Smoke-test an OpenAI-compatible chat completions endpoint with a minimal request.
 */
export async function validateOpenAiCompatibleChat(
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const base = baseUrl.replace(/\/+$/, "");
  const url = `${base}/chat/completions`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.trim(),
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });

    if (!res.ok) {
      const raw = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const errMsg =
        typeof raw.error === "object" &&
        raw.error &&
        "message" in raw.error &&
        typeof (raw.error as { message?: unknown }).message === "string"
          ? String((raw.error as { message: string }).message)
          : res.statusText;
      return {
        ok: false,
        message: `HTTP ${res.status}: ${errMsg}`,
      };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed.";
    return { ok: false, message: msg };
  } finally {
    clearTimeout(t);
  }
}

import "server-only";

import { validateOpenAiCompatibleChat } from "@/lib/ai/validate-openai-compatible";

/**
 * Smoke-test Anthropic Messages API (native, not OpenAI-compatible).
 */
export async function validateAnthropicNativeKey(
  apiKey: string,
  model: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25_000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ac.signal,
      headers: {
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.trim(),
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    if (!res.ok) {
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const errMsg =
        typeof raw.error === "object" &&
        raw.error &&
        "message" in raw.error &&
        typeof (raw.error as { message?: unknown }).message === "string"
          ? String((raw.error as { message: string }).message)
          : res.statusText;
      return { ok: false, message: `HTTP ${res.status}: ${errMsg}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Request failed.",
    };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Smoke-test Google Gemini generateContent (API key query param).
 */
export async function validateGoogleGeminiNativeKey(
  apiKey: string,
  model: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const m = model.trim();
  const key = apiKey.trim();
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
  );
  url.searchParams.set("key", key);

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25_000);
  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      signal: ac.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });

    if (!res.ok) {
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const errMsg =
        typeof raw.error === "object" &&
        raw.error &&
        "message" in raw.error &&
        typeof (raw.error as { message?: unknown }).message === "string"
          ? String((raw.error as { message: string }).message)
          : res.statusText;
      return { ok: false, message: `HTTP ${res.status}: ${errMsg}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Request failed.",
    };
  } finally {
    clearTimeout(t);
  }
}

export async function validateByokCatalogProvider(
  catalogProviderId: string,
  apiKey: string,
  model: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  switch (catalogProviderId) {
    case "openai":
      return validateOpenAiCompatibleChat(
        "https://api.openai.com/v1",
        apiKey,
        model,
      );
    case "anthropic":
      return validateAnthropicNativeKey(apiKey, model);
    case "google":
      return validateGoogleGeminiNativeKey(apiKey, model);
    default:
      return {
        ok: false,
        message: `Unsupported catalog provider: ${catalogProviderId}`,
      };
  }
}

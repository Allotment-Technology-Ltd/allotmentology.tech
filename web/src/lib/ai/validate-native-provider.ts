import "server-only";

import { explainAnthropicModelNotFound } from "@/lib/ai/anthropic-model-hints";
import type { CatalogProviderSummary } from "@/lib/restormel-keys/catalog";
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
      let line = `HTTP ${res.status}: ${errMsg}`;
      if (res.status === 404) {
        line += ` — ${explainAnthropicModelNotFound(model)}`;
      }
      return { ok: false, message: line };
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

function trimApiBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Inferred when `validation` is missing (older catalog feeds). */
export function catalogValidationMode(provider: CatalogProviderSummary): string {
  const raw = provider.validation?.mode?.trim().toLowerCase().replace(/-/g, "_");
  if (raw) return raw;
  if (provider.id === "openai") return "openai_compatible";
  if (provider.id === "anthropic" || provider.id === "google") return "native";
  return "openai_compatible";
}

export function isOpenAiCompatibleCatalogMode(provider: CatalogProviderSummary): boolean {
  const m = catalogValidationMode(provider);
  return m === "openai_compatible" || m === "openai_compat" || m === "openai";
}

/**
 * Validate a key using the catalog provider row (`validation.mode` + `id`), not a hardcoded id list.
 * For OpenAI-compatible modes, pass the resolved chat-completions base URL (including `validation.defaultApiBaseUrl`).
 */
export async function validateCatalogProviderKey(
  provider: CatalogProviderSummary,
  apiKey: string,
  model: string,
  openAiCompatibleBaseUrl: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const mode = catalogValidationMode(provider);

  if (
    mode === "openai_compatible" ||
    mode === "openai_compat" ||
    mode === "openai"
  ) {
    const base = openAiCompatibleBaseUrl?.trim();
    if (!base) {
      return {
        ok: false,
        message: "Missing API base URL for OpenAI-compatible validation.",
      };
    }
    return validateOpenAiCompatibleChat(trimApiBase(base), apiKey, model);
  }

  if (
    mode === "native" ||
    mode === "native_anthropic" ||
    mode === "anthropic_native" ||
    mode === "native_google" ||
    mode === "google_native"
  ) {
    if (provider.id === "anthropic") {
      return validateAnthropicNativeKey(apiKey, model);
    }
    if (provider.id === "google") {
      return validateGoogleGeminiNativeKey(apiKey, model);
    }
    return {
      ok: false,
      message: `Unsupported native catalog provider id: ${provider.id}.`,
    };
  }

  return {
    ok: false,
    message: `Unsupported validation mode "${mode}" for provider ${provider.id}.`,
  };
}

import "server-only";

import type { CatalogProviderSummary } from "@/lib/restormel-keys/catalog";

/**
 * BYOK + runtime API family for a Restormel catalog provider row.
 *
 * | `providers[].id` | API | Validate / resolve |
 * |---|---|---|
 * | **anthropic** | Anthropic Messages API | `POST https://api.anthropic.com/v1/messages` (native SDK path in app) |
 * | **google** | Google Gemini | `generateContent` on `generativelanguage.googleapis.com` |
 * | **Everything else** (openai, mistral, groq, together, azure with user base, …) | OpenAI-compatible **Chat Completions** | `POST {baseUrl}/chat/completions` — `defaultApiBaseUrl` / legacy map when `requiresBaseUrl === false` |
 *
 * `validation.mode` from Restormel (`native` | `openai_compatible` | `none`) controls **base URL policy** (requires user URL vs default), **not** which row above applies. Mis-tagged `native` for Mistral is ignored because routing is **id-first**.
 */
export type CatalogProviderRoutingKind =
  | "anthropic_messages"
  | "google_gemini"
  | "openai_chat";

export function resolveCatalogProviderRouting(
  provider: CatalogProviderSummary,
): CatalogProviderRoutingKind {
  const id = provider.id.trim().toLowerCase();
  if (id === "anthropic") return "anthropic_messages";
  if (id === "google") return "google_gemini";
  return "openai_chat";
}

/** BYOK: resolve base URL + OpenAI-compat chat validation when not Anthropic/Gemini native. */
export function catalogProviderUsesOpenAiChat(provider: CatalogProviderSummary): boolean {
  return resolveCatalogProviderRouting(provider) === "openai_chat";
}

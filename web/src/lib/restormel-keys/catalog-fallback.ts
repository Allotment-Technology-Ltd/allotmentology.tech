import type { CanonicalCatalogResponse } from "@restormel/keys/dashboard";

/**
 * Minimal viable catalog when the canonical Restormel feed is unreachable.
 * Uses current-generation model ids; keep aligned with vendor docs.
 */
export function buildLocalFallbackCatalog(): CanonicalCatalogResponse {
  const now = new Date().toISOString();
  const data: CanonicalCatalogResponse["data"] = [
    mk("openai-gpt-4o-mini", "GPT-4o mini", "openai", "gpt-4o-mini"),
    mk("openai-gpt-4o", "GPT-4o", "openai", "gpt-4o"),
    mk("anthropic-haiku-45", "Claude Haiku 4.5", "anthropic", "claude-haiku-4-5"),
    mk("anthropic-sonnet-46", "Claude Sonnet 4.6", "anthropic", "claude-sonnet-4-6"),
    mk("anthropic-opus-46", "Claude Opus 4.6", "anthropic", "claude-opus-4-6"),
    mk("google-gemini-flash", "Gemini 2.5 Flash", "google", "gemini-2.5-flash"),
    mk("google-gemini-pro", "Gemini 2.5 Pro", "google", "gemini-2.5-pro"),
  ];

  return {
    contractVersion: "local-fallback-1",
    source: "restormel-keys",
    generatedAt: now,
    providers: [
      {
        id: "openai",
        displayName: "OpenAI",
        modelCount: 2,
        validation: {
          mode: "openai_compatible",
          requiresBaseUrl: false,
          requiresModel: true,
        },
      },
      {
        id: "anthropic",
        displayName: "Anthropic",
        modelCount: 3,
        validation: {
          mode: "native",
          requiresBaseUrl: false,
          requiresModel: true,
        },
      },
      {
        id: "google",
        displayName: "Google",
        modelCount: 2,
        validation: {
          mode: "native",
          requiresBaseUrl: false,
          requiresModel: true,
        },
      },
    ],
    data,
    paging: { limit: 100, offset: 0, count: data.length },
  };
}

function mk(
  id: string,
  canonicalName: string,
  providerType: string,
  providerModelId: string,
): CanonicalCatalogResponse["data"][number] {
  return {
    id,
    canonicalName,
    family: null,
    lifecycleState: "ga",
    providerTypes: [providerType],
    variants: [
      {
        id: `${id}::v1`,
        providerType,
        providerModelId,
        availabilityStatus: "available",
      },
    ],
  };
}

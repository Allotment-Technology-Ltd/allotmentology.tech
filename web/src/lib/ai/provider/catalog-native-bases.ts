import "server-only";

/** API bases for providers from the Restormel Keys canonical catalog (native modes). */
export const CATALOG_NATIVE_PROVIDER_BASE_URL: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  /** Legacy fallback when the catalog omits `defaultApiBaseUrl`; prefer Restormel Keys. */
  mistral: "https://api.mistral.ai/v1",
};

export function resolveCatalogNativeBaseUrl(catalogProviderId: string): string | null {
  return CATALOG_NATIVE_PROVIDER_BASE_URL[catalogProviderId] ?? null;
}

export const BYOK_PRESET_IDS = [
  "openai",
  "openrouter",
  "groq",
  "restormel_keys",
  "custom",
] as const;

export type ByokPresetId = (typeof BYOK_PRESET_IDS)[number];

export const BYOK_PRESET_LABEL: Record<ByokPresetId, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  groq: "Groq",
  restormel_keys: "Restormel Keys",
  custom: "Custom (OpenAI-compatible URL)",
};

/** Default model placeholder hints per preset (user can change). */
export const BYOK_DEFAULT_MODEL_HINT: Partial<Record<ByokPresetId, string>> = {
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  restormel_keys: "restormel-writer-v1",
  custom: "your-model-id",
};

export function defaultBaseUrlForPreset(preset: string): string | null {
  switch (preset) {
    case "openai":
      return "https://api.openai.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "restormel_keys":
      return (
        process.env.RESTORMEL_KEYS_BASE_URL?.trim() ||
        "https://api.restormel.dev/v1"
      );
    default:
      return null;
  }
}

export function resolveEffectiveBaseUrl(
  preset: string,
  customBaseUrl: string | null | undefined,
): string {
  if (preset === "custom") {
    const u = (customBaseUrl ?? "").trim();
    if (!u) {
      throw new Error("Enter a base URL for the custom provider.");
    }
    return u.replace(/\/+$/, "");
  }
  if (preset === "restormel_keys") {
    const u =
      (customBaseUrl ?? "").trim() ||
      process.env.RESTORMEL_KEYS_BASE_URL?.trim() ||
      "https://api.restormel.dev/v1";
    return u.replace(/\/+$/, "");
  }
  const d = defaultBaseUrlForPreset(preset);
  if (!d) {
    throw new Error("Invalid provider.");
  }
  return d.replace(/\/+$/, "");
}

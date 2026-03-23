/**
 * Curated OpenAI-compatible providers for BYOK UI: fixed base URL + model list,
 * or manual base URL / model where the host is user-specific (Azure, local, custom).
 */
export type ByokProviderPreset = {
  id: string;
  /** Shown in UI */
  displayName: string;
  /** Persisted on the key row */
  providerName: string;
  /**
   * API base including version path (…/v1) when not {@link manualBaseUrl}.
   * Ignored when manualBaseUrl is true (user supplies URL).
   */
  baseUrl: string;
  /** When true, show a base URL field (Azure, local proxy, fully custom). */
  manualBaseUrl: boolean;
  /** Placeholder for the base URL input when manualBaseUrl */
  baseUrlPlaceholder?: string;
  /**
   * Model ids for dropdown. If empty, show a free-text model field
   * (deployment name, local model id, etc.).
   */
  models: readonly { id: string; label: string }[];
  modelPlaceholder?: string;
};

export const BYOK_PROVIDER_PRESETS: readonly ByokProviderPreset[] = [
  {
    id: "openai",
    displayName: "OpenAI",
    providerName: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    manualBaseUrl: false,
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "o3-mini", label: "o3-mini" },
    ],
  },
  {
    id: "openrouter",
    displayName: "OpenRouter",
    providerName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    manualBaseUrl: false,
    models: [
      { id: "openai/gpt-4o-mini", label: "OpenAI: GPT-4o mini" },
      { id: "openai/gpt-4o", label: "OpenAI: GPT-4o" },
      {
        id: "anthropic/claude-3.5-sonnet",
        label: "Anthropic: Claude 3.5 Sonnet",
      },
      { id: "google/gemini-2.0-flash-001", label: "Google: Gemini 2.0 Flash" },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        label: "Meta: Llama 3.3 70B Instruct",
      },
    ],
  },
  {
    id: "groq",
    displayName: "Groq",
    providerName: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    manualBaseUrl: false,
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
  },
  {
    id: "together",
    displayName: "Together AI",
    providerName: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    manualBaseUrl: false,
    models: [
      {
        id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        label: "Llama 3.3 70B Instruct Turbo",
      },
      {
        id: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        label: "Llama 3.1 8B Instruct",
      },
      {
        id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
        label: "DeepSeek R1 Distill Llama 70B (free tier)",
      },
    ],
  },
  {
    id: "fireworks",
    displayName: "Fireworks AI",
    providerName: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    manualBaseUrl: false,
    models: [
      {
        id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        label: "Llama 3.3 70B Instruct",
      },
      {
        id: "accounts/fireworks/models/llama-v3p1-8b-instruct",
        label: "Llama 3.1 8B Instruct",
      },
    ],
  },
  {
    id: "mistral",
    displayName: "Mistral",
    providerName: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    manualBaseUrl: false,
    models: [
      { id: "mistral-small-latest", label: "Mistral Small" },
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "codestral-latest", label: "Codestral" },
    ],
  },
  {
    id: "deepseek",
    displayName: "DeepSeek",
    providerName: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    manualBaseUrl: false,
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner" },
    ],
  },
  {
    id: "perplexity",
    displayName: "Perplexity",
    providerName: "Perplexity",
    baseUrl: "https://api.perplexity.ai",
    manualBaseUrl: false,
    models: [
      { id: "sonar", label: "Sonar" },
      { id: "sonar-pro", label: "Sonar Pro" },
      { id: "sonar-reasoning", label: "Sonar Reasoning" },
    ],
  },
  {
    id: "azure",
    displayName: "Azure OpenAI",
    providerName: "Azure OpenAI",
    baseUrl: "",
    manualBaseUrl: true,
    baseUrlPlaceholder:
      "https://YOUR_RESOURCE.openai.azure.com/openai/deployments/DEPLOYMENT_NAME",
    models: [],
    modelPlaceholder: "Often same as deployment name (check Azure docs)",
  },
  {
    id: "local",
    displayName: "Local / proxy (Ollama, vLLM, LiteLLM, …)",
    providerName: "Local / compatible proxy",
    baseUrl: "http://127.0.0.1:11434/v1",
    manualBaseUrl: true,
    baseUrlPlaceholder: "http://127.0.0.1:11434/v1",
    models: [],
    modelPlaceholder: "e.g. llama3.2, qwen2.5, or LiteLLM route name",
  },
  {
    id: "custom",
    displayName: "Custom (any OpenAI-compatible URL)",
    providerName: "Custom",
    baseUrl: "",
    manualBaseUrl: true,
    baseUrlPlaceholder: "https://host.example/v1",
    models: [],
    modelPlaceholder: "Model id from provider docs",
  },
] as const;

export function getByokPresetById(id: string): ByokProviderPreset | undefined {
  return BYOK_PROVIDER_PRESETS.find((p) => p.id === id);
}

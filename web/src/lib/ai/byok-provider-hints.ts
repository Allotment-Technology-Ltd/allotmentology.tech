/**
 * Quick-fill hints only — users can type any provider name and OpenAI-compatible base URL.
 */
export const BYOK_PROVIDER_ENDPOINT_HINTS = [
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
  { name: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  { name: "Together AI", baseUrl: "https://api.together.xyz/v1" },
  { name: "Fireworks", baseUrl: "https://api.fireworks.ai/inference/v1" },
  { name: "Mistral", baseUrl: "https://api.mistral.ai/v1" },
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
  { name: "Perplexity", baseUrl: "https://api.perplexity.ai" },
  { name: "Azure OpenAI", baseUrl: "https://YOUR_RESOURCE.openai.azure.com/openai/deployments" },
  { name: "Local / proxy (Ollama, vLLM, LiteLLM, …)", baseUrl: "http://localhost:11434/v1" },
] as const;

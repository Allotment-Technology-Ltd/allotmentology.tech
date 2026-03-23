/**
 * Anthropic returns HTTP 404 when the model id is unknown or no longer served.
 * That is not an “invalid API key” error (auth failures are typically 401).
 *
 * @see https://docs.anthropic.com/en/docs/resources/model-deprecations
 * @see https://docs.anthropic.com/en/docs/about-claude/models/overview
 */
export const ANTHROPIC_MODEL_DEPRECATIONS_DOC =
  "https://docs.anthropic.com/en/docs/resources/model-deprecations";

export const ANTHROPIC_MODELS_OVERVIEW_DOC =
  "https://docs.anthropic.com/en/docs/about-claude/models/overview";

/** Retired or commonly stale ids → suggested replacement (API id or alias). */
const RETIRED_HINTS: Record<string, string> = {
  "claude-3-5-haiku-20241022":
    "claude-haiku-4-5 (alias) or claude-haiku-4-5-20251001 (snapshot)",
  "claude-3-5-haiku-latest":
    "claude-haiku-4-5 (alias) or claude-haiku-4-5-20251001 (snapshot)",
};

/**
 * Extra user-facing text when Messages API returns 404.
 */
export function explainAnthropicModelNotFound(modelId: string): string {
  const id = modelId.trim();
  const specific = RETIRED_HINTS[id];
  const base =
    "Your API key can still be valid: Anthropic uses HTTP 404 when the model name is not available (wrong id or retired).";
  if (specific) {
    return `${base} "${id}" is no longer served — try ${specific}. Docs: ${ANTHROPIC_MODEL_DEPRECATIONS_DOC}`;
  }
  return `${base} Update the model under Settings → BYOK to a current Claude API id. Overview: ${ANTHROPIC_MODELS_OVERVIEW_DOC}`;
}

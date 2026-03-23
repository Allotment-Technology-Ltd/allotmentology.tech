/**
 * Maps common catalog / typo variants to Anthropic Messages API model ids.
 * Restormel should own canonical ids; this is defense-in-depth when the feed lists a bad slug.
 *
 * @see https://docs.anthropic.com/en/docs/about-claude/models
 */
export function normalizeAnthropicCatalogModelId(model: string): string {
  const m = model.trim();
  const aliases: Record<string, string> = {
    // Wrong punctuation from some feeds / UIs
    "claude-haiku-4.5": "claude-haiku-4-5",
    "claude-sonnet-4.5": "claude-sonnet-4-5",
    "claude-opus-4.5": "claude-opus-4-5",
    "claude-haiku-4_5": "claude-haiku-4-5",
  };
  return aliases[m] ?? m;
}

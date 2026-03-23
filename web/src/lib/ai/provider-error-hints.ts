/**
 * User-facing hints appended to raw provider errors (BYOK / OpenAI-compatible / native).
 */
export function augmentProviderErrorMessage(
  message: string,
  status?: number,
): string {
  const authFailure =
    status === 401 ||
    status === 403 ||
    /\(\s*401\s*\)/.test(message) ||
    /\(\s*403\s*\)/.test(message);

  const notFound =
    status === 404 ||
    /\(\s*404\s*\)/.test(message) ||
    /\b404\b.*error/i.test(message);

  if (authFailure) {
    return `${message}

What usually fixes this:
• The API base URL must match the key (e.g. DeepSeek: https://api.deepseek.com/v1 and model deepseek-chat — not OpenAI’s host or an OpenAI model id).
• If you picked a model from the Restormel catalog, it must be the same vendor as your key.
• Revoke a bad default key under Settings → BYOK & AI keys so the app can fall back to the server AI_API_KEY / OPENAI_API_KEY when those are set.`;
  }

  if (notFound) {
    return `${message}

What usually fixes this:
• **404** often means the **model id is wrong or retired** — pick a current id from the Restormel catalog or the vendor’s docs (not “app broken”).
• Native Anthropic/Google/OpenAI each use different model strings; your BYOK row must match the **same** vendor as the key.`;
  }

  return message;
}

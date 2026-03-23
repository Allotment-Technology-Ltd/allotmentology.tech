/**
 * Emergency denylist for provider model ids that must not appear in the BYOK picker
 * during catalog feed lag (e.g. vendor-retired snapshots still marked available).
 */
export const CATALOG_PROVIDER_MODEL_DENYLIST = new Set<string>([
  "claude-3-5-haiku-20241022",
  "claude-3-5-haiku-latest",
]);

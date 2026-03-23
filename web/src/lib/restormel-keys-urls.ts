/**
 * Public Restormel Keys URLs.
 *
 * The marketing site links the Gateway API docs portal on Zuplo (not restormel.dev/keys/api-portal,
 * which is not deployed). See https://restormel.dev/keys/dashboard → "API portal".
 */
export const RESTORMEL_KEYS_HOME = "https://restormel.dev/keys";

export const RESTORMEL_KEYS_DASHBOARD_URL =
  "https://restormel.dev/keys/dashboard";

/** Gateway API reference & playground (Zuplo). Override if Restormel publishes a new portal URL. */
export function restormelKeysApiPortalUrl(): string {
  return (
    process.env.NEXT_PUBLIC_RESTORMEL_KEYS_API_PORTAL_URL ??
    "https://restormel-keys-gateway-main-bc13eba.zuplo.site"
  );
}

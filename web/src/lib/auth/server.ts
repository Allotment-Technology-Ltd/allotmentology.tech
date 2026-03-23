import { createAuthServer } from "@neondatabase/auth/next/server";

import { isNeonAuthConfigured } from "./auth-config";

export { isNeonAuthConfigured } from "./auth-config";

let cached: ReturnType<typeof createAuthServer> | undefined;

export function getAuthServer() {
  if (!isNeonAuthConfigured()) {
    throw new Error("Neon Auth is not configured (set NEON_AUTH_BASE_URL).");
  }
  if (!cached) {
    cached = createAuthServer();
  }
  return cached;
}

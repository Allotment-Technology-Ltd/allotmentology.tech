"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export function isNeonAuthConfiguredClient(): boolean {
  const u = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;
  return Boolean(u && u.trim().length > 0 && !u.includes("YOUR_AUTH_HOST"));
}

let cached: ReturnType<typeof createAuthClient> | undefined;

export function getAuthClient() {
  if (!isNeonAuthConfiguredClient()) {
    throw new Error("Neon Auth is not configured (set NEON_AUTH_BASE_URL).");
  }
  if (!cached) {
    cached = createAuthClient();
  }
  return cached;
}

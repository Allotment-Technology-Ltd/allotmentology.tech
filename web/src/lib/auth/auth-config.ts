/** Neon Auth URL from server env (middleware + server components). */
export function isNeonAuthConfigured(): boolean {
  const u = process.env.NEON_AUTH_BASE_URL;
  return Boolean(u && u.trim().length > 0 && !u.includes("YOUR_AUTH_HOST"));
}

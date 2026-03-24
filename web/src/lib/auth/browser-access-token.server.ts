import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { browserAccessTokens } from "@/db/schema/tables";
import { getServerDb } from "@/lib/db/server";

export function hashBrowserAccessToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** 64-char hex secret; only shown once at creation. */
export function generateBrowserAccessTokenSecret(): { raw: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, prefix: raw.slice(0, 8) };
}

export async function findBrowserAccessTokenBySecret(
  raw: string,
): Promise<{ userId: string; tokenId: string } | null> {
  const rawTrim = raw.trim();
  if (!rawTrim) return null;
  const hash = hashBrowserAccessToken(rawTrim);
  const db = getServerDb();
  const [row] = await db
    .select({
      id: browserAccessTokens.id,
      userId: browserAccessTokens.userId,
    })
    .from(browserAccessTokens)
    .where(eq(browserAccessTokens.tokenHash, hash))
    .limit(1);
  if (!row) return null;
  return { userId: row.userId, tokenId: row.id };
}

export async function touchBrowserAccessToken(tokenId: string): Promise<void> {
  const db = getServerDb();
  await db
    .update(browserAccessTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(browserAccessTokens.id, tokenId));
}

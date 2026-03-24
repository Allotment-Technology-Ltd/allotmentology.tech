"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { browserAccessTokens } from "@/db/schema/tables";
import {
  generateBrowserAccessTokenSecret,
  hashBrowserAccessToken,
} from "@/lib/auth/browser-access-token.server";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";

export type BrowserAccessTokenListItem = {
  id: string;
  tokenPrefix: string;
  label: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export async function listBrowserAccessTokens(): Promise<BrowserAccessTokenListItem[]> {
  const { email } = await getSessionUserEmailOrRedirect();
  const userId = await getAppUserIdByEmail(email);
  if (!userId) return [];
  const db = getServerDb();
  return db
    .select({
      id: browserAccessTokens.id,
      tokenPrefix: browserAccessTokens.tokenPrefix,
      label: browserAccessTokens.label,
      createdAt: browserAccessTokens.createdAt,
      lastUsedAt: browserAccessTokens.lastUsedAt,
    })
    .from(browserAccessTokens)
    .where(eq(browserAccessTokens.userId, userId))
    .orderBy(desc(browserAccessTokens.createdAt));
}

export async function createBrowserAccessToken(
  label?: string | null,
): Promise<{ ok: true; rawToken: string } | { ok: false; error: string }> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }
    const labelParsed = z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable()
      .safeParse(label);
    const safeLabel =
      labelParsed.success && labelParsed.data ? labelParsed.data : null;

    const { raw, prefix } = generateBrowserAccessTokenSecret();
    const db = getServerDb();
    await db.insert(browserAccessTokens).values({
      userId,
      tokenHash: hashBrowserAccessToken(raw),
      tokenPrefix: prefix,
      label: safeLabel,
    });
    revalidatePath("/settings/browser-extension");
    return { ok: true, rawToken: raw };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create token.",
    };
  }
}

export async function revokeBrowserAccessToken(
  tokenId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!z.string().uuid().safeParse(tokenId).success) {
      return { ok: false, error: "Invalid token id." };
    }
    const { email } = await getSessionUserEmailOrRedirect();
    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }
    const db = getServerDb();
    await db
      .delete(browserAccessTokens)
      .where(
        and(
          eq(browserAccessTokens.id, tokenId),
          eq(browserAccessTokens.userId, userId),
        ),
      );
    revalidatePath("/settings/browser-extension");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not revoke token.",
    };
  }
}

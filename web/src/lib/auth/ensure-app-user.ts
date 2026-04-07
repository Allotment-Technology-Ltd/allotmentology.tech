import "server-only";

import { createDb } from "@/db";
import { users } from "@/db/schema/tables";

import { isNeonAuthConfigured } from "./auth-config";
import { getAuthServer } from "./server";

function getBootstrapAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Upserts `public.users` from the Neon Auth session (first sign-in and profile refresh).
 */
export async function ensureAppUser() {
  if (!isNeonAuthConfigured()) return null;

  const { data: session } = await getAuthServer().getSession();
  const email = session?.user?.email;
  if (!email) return null;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = createDb(url);
  const displayName = session.user.name ?? null;
  const avatarUrl = session.user.image ?? null;
  const isBootstrapAdmin = getBootstrapAdminEmails().has(email.toLowerCase());

  const [row] = await db
    .insert(users)
    .values({
      email,
      displayName,
      avatarUrl,
      isAdmin: isBootstrapAdmin,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        displayName,
        avatarUrl,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row ?? null;
}

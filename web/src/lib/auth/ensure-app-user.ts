import "server-only";

import { createDb } from "@/db";
import { users } from "@/db/schema/tables";

import { authServer } from "./server";

/**
 * Upserts `public.users` from the Neon Auth session (first sign-in and profile refresh).
 */
export async function ensureAppUser() {
  const { data: session } = await authServer.getSession();
  const email = session?.user?.email;
  if (!email) return null;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = createDb(url);
  const displayName = session.user.name ?? null;
  const avatarUrl = session.user.image ?? null;

  const [row] = await db
    .insert(users)
    .values({
      email,
      displayName,
      avatarUrl,
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

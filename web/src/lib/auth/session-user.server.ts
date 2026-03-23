import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { users } from "@/db/schema/tables";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";

export async function getSessionUserEmailOrRedirect(): Promise<{ email: string }> {
  const { data } = await getAuthServer().getSession();
  const email = data?.user?.email;
  if (!email) {
    redirect("/auth/sign-in");
  }
  return { email };
}

export async function getAppUserIdByEmail(email: string): Promise<string | null> {
  const db = getServerDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

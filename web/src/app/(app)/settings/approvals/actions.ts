"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { users } from "@/db/schema/tables";
import { requireAdminAppUserOrRedirect } from "@/lib/auth/access-control.server";
import { getServerDb } from "@/lib/db/server";

const APPROVALS_PATH = "/settings/approvals";

function getUserId(formData: FormData): string | null {
  const value = formData.get("userId");
  if (typeof value !== "string") return null;
  if (!z.string().uuid().safeParse(value).success) return null;
  return value;
}

export type ApprovalsPageData = {
  pending: Array<{
    id: string;
    email: string;
    displayName: string | null;
    createdAt: Date;
  }>;
  recentlyApproved: Array<{
    id: string;
    email: string;
    displayName: string | null;
    approvedAt: Date | null;
  }>;
  recentlyRejected: Array<{
    id: string;
    email: string;
    displayName: string | null;
    updatedAt: Date;
  }>;
};

export async function loadApprovalsPageData(): Promise<ApprovalsPageData> {
  await requireAdminAppUserOrRedirect();
  const db = getServerDb();

  const [pending, recentlyApproved, recentlyRejected] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.approvalStatus, "pending"))
      .orderBy(asc(users.createdAt)),
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        approvedAt: users.approvedAt,
      })
      .from(users)
      .where(eq(users.approvalStatus, "approved"))
      .orderBy(desc(users.approvedAt), desc(users.updatedAt))
      .limit(8),
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.approvalStatus, "rejected"))
      .orderBy(desc(users.updatedAt))
      .limit(8),
  ]);

  return { pending, recentlyApproved, recentlyRejected };
}

export async function approveUserAccessAction(formData: FormData) {
  await requireAdminAppUserOrRedirect();
  const userId = getUserId(formData);
  if (!userId) return;

  await getServerDb()
    .update(users)
    .set({
      approvalStatus: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath(APPROVALS_PATH);
}

export async function rejectUserAccessAction(formData: FormData) {
  await requireAdminAppUserOrRedirect();
  const userId = getUserId(formData);
  if (!userId) return;

  await getServerDb()
    .update(users)
    .set({
      approvalStatus: "rejected",
      approvedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath(APPROVALS_PATH);
}

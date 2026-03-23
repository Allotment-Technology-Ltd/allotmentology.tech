"use server";

import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  collateralItems,
  opportunities,
  submissionPackCollateralItems,
  submissionPacks,
  users,
} from "@/db/schema/tables";
import { collateralFormSchema } from "@/lib/collateral/zod";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";
import { COLLATERAL_KINDS } from "@/lib/collateral/constants";

export type FormState = { error: string | null };

async function requireSessionUser() {
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) redirect("/auth/sign-in");
  return data.user;
}

async function getAppUserIdByEmail(email: string) {
  const db = getServerDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

function parseCollateralForm(fd: FormData) {
  return {
    title: String(fd.get("title") ?? ""),
    kind: String(fd.get("kind") ?? "standard_answer"),
    body: String(fd.get("body") ?? ""),
    tags: String(fd.get("tags") ?? ""),
    approved: fd.get("approved") === "1",
  };
}

export async function saveCollateral(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireSessionUser();
  const parsed = collateralFormSchema.safeParse(parseCollateralForm(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid collateral form.",
    };
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  const tags =
    parsed.data.tags.length > 0 ? parsed.data.tags : null;
  const now = new Date();
  const idRaw = formData.get("id");
  const existingId =
    typeof idRaw === "string" && z.string().uuid().safeParse(idRaw).success
      ? idRaw
      : null;

  if (existingId) {
    const [prevRow] = await db
      .select({ version: collateralItems.version })
      .from(collateralItems)
      .where(eq(collateralItems.id, existingId))
      .limit(1);
    if (!prevRow) return { error: "Item not found." };

    await db
      .update(collateralItems)
      .set({
        title: parsed.data.title,
        kind: parsed.data.kind,
        body: parsed.data.body,
        tags,
        approved: parsed.data.approved,
        version: prevRow.version + 1,
        updatedAt: now,
      })
      .where(eq(collateralItems.id, existingId));

    revalidatePath("/collateral");
    revalidatePath(`/collateral/${existingId}`);
    revalidatePath(`/collateral/${existingId}/edit`);
    redirect(`/collateral/${existingId}`);
  }

  const [inserted] = await db
    .insert(collateralItems)
    .values({
      title: parsed.data.title,
      kind: parsed.data.kind,
      body: parsed.data.body,
      tags,
      approved: parsed.data.approved,
      version: 1,
      createdByUserId: appUserId,
      updatedAt: now,
    })
    .returning({ id: collateralItems.id });

  if (!inserted) return { error: "Could not create collateral." };

  revalidatePath("/collateral");
  redirect(`/collateral/${inserted.id}`);
}

export async function deleteCollateral(formData: FormData) {
  await requireSessionUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !z.string().uuid().safeParse(id).success) {
    return;
  }
  const db = getServerDb();
  await db.delete(collateralItems).where(eq(collateralItems.id, id));
  revalidatePath("/collateral");
  redirect("/collateral");
}

export async function linkPackToCollateral(formData: FormData) {
  await requireSessionUser();
  const collateralId = formData.get("collateralId");
  const packId = formData.get("submissionPackId");
  if (
    typeof collateralId !== "string" ||
    typeof packId !== "string" ||
    !z.string().uuid().safeParse(collateralId).success ||
    !z.string().uuid().safeParse(packId).success
  ) {
    return;
  }
  const db = getServerDb();
  await db
    .insert(submissionPackCollateralItems)
    .values({
      collateralItemId: collateralId,
      submissionPackId: packId,
    })
    .onConflictDoNothing();
  revalidatePath(`/collateral/${collateralId}`);
}

export async function unlinkPackFromCollateral(formData: FormData) {
  await requireSessionUser();
  const collateralId = formData.get("collateralId");
  const packId = formData.get("submissionPackId");
  if (
    typeof collateralId !== "string" ||
    typeof packId !== "string" ||
    !z.string().uuid().safeParse(collateralId).success ||
    !z.string().uuid().safeParse(packId).success
  ) {
    return;
  }
  const db = getServerDb();
  await db
    .delete(submissionPackCollateralItems)
    .where(
      and(
        eq(submissionPackCollateralItems.collateralItemId, collateralId),
        eq(submissionPackCollateralItems.submissionPackId, packId),
      ),
    );
  revalidatePath(`/collateral/${collateralId}`);
}

export async function loadCollateralList(filters: {
  q?: string;
  kind?: string;
  approved?: string;
}) {
  await requireSessionUser();
  const db = getServerDb();
  const q = filters.q?.trim();
  const kind = filters.kind?.trim();
  const approved = filters.approved?.trim() ?? "all";

  const conditions = [];
  if (kind && kind !== "all") {
    const k = z.enum(COLLATERAL_KINDS).safeParse(kind);
    if (k.success) conditions.push(eq(collateralItems.kind, k.data));
  }
  if (approved === "approved") {
    conditions.push(eq(collateralItems.approved, true));
  } else if (approved === "draft") {
    conditions.push(eq(collateralItems.approved, false));
  }
  if (q) {
    const pattern = `%${q.replace(/%/g, "\\%")}%`;
    conditions.push(
      or(
        ilike(collateralItems.title, pattern),
        ilike(collateralItems.body, pattern),
      )!,
    );
  }

  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const rows = await db
    .select({
      item: collateralItems,
      authorName: users.displayName,
      authorEmail: users.email,
    })
    .from(collateralItems)
    .leftJoin(users, eq(collateralItems.createdByUserId, users.id))
    .where(where)
    .orderBy(desc(collateralItems.updatedAt));

  const ids = rows.map((r) => r.item.id);
  const packLinkRows =
    ids.length === 0
      ? []
      : await db
          .select({
            collateralItemId: submissionPackCollateralItems.collateralItemId,
          })
          .from(submissionPackCollateralItems)
          .where(inArray(submissionPackCollateralItems.collateralItemId, ids));

  const countMap = new Map<string, number>();
  for (const row of packLinkRows) {
    const cid = row.collateralItemId;
    countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
  }

  return rows.map((r) => ({
    ...r,
    packRefCount: countMap.get(r.item.id) ?? 0,
  }));
}

export async function loadCollateralDetail(id: string) {
  await requireSessionUser();
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = getServerDb();

  const [row] = await db
    .select({
      item: collateralItems,
      authorName: users.displayName,
      authorEmail: users.email,
    })
    .from(collateralItems)
    .leftJoin(users, eq(collateralItems.createdByUserId, users.id))
    .where(eq(collateralItems.id, id))
    .limit(1);

  if (!row) return null;

  const packLinks = await db
    .select({
      packId: submissionPacks.id,
      packTitle: submissionPacks.title,
      packStatus: submissionPacks.status,
      opportunityId: opportunities.id,
      opportunityTitle: opportunities.title,
    })
    .from(submissionPackCollateralItems)
    .innerJoin(
      submissionPacks,
      eq(submissionPackCollateralItems.submissionPackId, submissionPacks.id),
    )
    .innerJoin(
      opportunities,
      eq(submissionPacks.opportunityId, opportunities.id),
    )
    .where(eq(submissionPackCollateralItems.collateralItemId, id))
    .orderBy(desc(submissionPacks.updatedAt));

  return { ...row, packLinks };
}

export async function loadPackOptionsForCollateralLink() {
  await requireSessionUser();
  const db = getServerDb();
  return db
    .select({
      packId: submissionPacks.id,
      packTitle: submissionPacks.title,
      opportunityTitle: opportunities.title,
    })
    .from(submissionPacks)
    .innerJoin(
      opportunities,
      eq(submissionPacks.opportunityId, opportunities.id),
    )
    .orderBy(desc(submissionPacks.updatedAt))
    .limit(200);
}

"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  knowledgeAssets,
  writingStyleProfiles,
  writingStyleSamples,
  users,
} from "@/db/schema/tables";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";

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

const assetSchema = z.object({
  title: z.string().trim().min(2).max(512),
  sourceType: z.enum(["repository", "document", "file", "portal", "other"]),
  url: z.string().trim().url(),
  summary: z.string().trim().max(4000).optional().default(""),
  tags: z.string().trim().optional().default(""),
});

const styleProfileSchema = z.object({
  profileName: z.string().trim().min(2).max(255),
  voiceDescription: z.string().trim().min(8).max(6000),
  styleGuardrailsMd: z.string().trim().min(8).max(8000),
  bannedPhrases: z.string().trim().optional().default(""),
  preferredStructure: z.string().trim().max(4000).optional().default(""),
});

const styleSampleSchema = z.object({
  title: z.string().trim().min(2).max(512),
  sampleText: z.string().trim().min(20).max(12000),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")).default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function createKnowledgeAsset(
  formData: FormData,
): Promise<void> {
  const user = await requireSessionUser();
  const parsed = assetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid knowledge asset.");
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) throw new Error("Local user profile missing; reload and try again.");

  const tags =
    parsed.data.tags.trim().length === 0
      ? null
      : parsed.data.tags
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);

  const db = getServerDb();
  await db.insert(knowledgeAssets).values({
    title: parsed.data.title,
    sourceType: parsed.data.sourceType,
    url: parsed.data.url,
    summary: parsed.data.summary || null,
    tags,
    createdByUserId: appUserId,
    updatedAt: new Date(),
  });

  revalidatePath("/knowledge");
}

export async function deleteKnowledgeAsset(formData: FormData) {
  await requireSessionUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !z.string().uuid().safeParse(id).success) return;
  const db = getServerDb();
  await db.delete(knowledgeAssets).where(eq(knowledgeAssets.id, id));
  revalidatePath("/knowledge");
}

export async function saveWritingStyleProfile(
  formData: FormData,
): Promise<void> {
  const user = await requireSessionUser();
  const parsed = styleProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid writing style profile.",
    );
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) throw new Error("Local user profile missing; reload and try again.");

  const bannedPhrases =
    parsed.data.bannedPhrases.trim().length === 0
      ? null
      : parsed.data.bannedPhrases
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean);

  const db = getServerDb();
  await db
    .insert(writingStyleProfiles)
    .values({
      ownerUserId: appUserId,
      profileName: parsed.data.profileName,
      voiceDescription: parsed.data.voiceDescription,
      styleGuardrailsMd: parsed.data.styleGuardrailsMd,
      bannedPhrases,
      preferredStructure: parsed.data.preferredStructure || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: writingStyleProfiles.ownerUserId,
      set: {
        profileName: parsed.data.profileName,
        voiceDescription: parsed.data.voiceDescription,
        styleGuardrailsMd: parsed.data.styleGuardrailsMd,
        bannedPhrases,
        preferredStructure: parsed.data.preferredStructure || null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/knowledge");
}

export async function addWritingStyleSample(
  formData: FormData,
): Promise<void> {
  const user = await requireSessionUser();
  const parsed = styleSampleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid style sample.");
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) throw new Error("Local user profile missing; reload and try again.");
  const db = getServerDb();
  const [profile] = await db
    .select({ id: writingStyleProfiles.id })
    .from(writingStyleProfiles)
    .where(eq(writingStyleProfiles.ownerUserId, appUserId))
    .limit(1);
  if (!profile) {
    throw new Error("Create a writing style profile first.");
  }

  await db.insert(writingStyleSamples).values({
    profileId: profile.id,
    title: parsed.data.title,
    sampleText: parsed.data.sampleText,
    sourceUrl: parsed.data.sourceUrl || null,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/knowledge");
}

export async function deleteWritingStyleSample(formData: FormData) {
  await requireSessionUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !z.string().uuid().safeParse(id).success) return;
  const db = getServerDb();
  await db.delete(writingStyleSamples).where(eq(writingStyleSamples.id, id));
  revalidatePath("/knowledge");
}

export async function loadKnowledgePageData() {
  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) return null;
  const db = getServerDb();

  const assets = await db
    .select()
    .from(knowledgeAssets)
    .orderBy(desc(knowledgeAssets.updatedAt), asc(knowledgeAssets.title));

  const [profile] = await db
    .select()
    .from(writingStyleProfiles)
    .where(eq(writingStyleProfiles.ownerUserId, appUserId))
    .limit(1);

  const samples = profile
    ? await db
        .select()
        .from(writingStyleSamples)
        .where(eq(writingStyleSamples.profileId, profile.id))
        .orderBy(desc(writingStyleSamples.createdAt))
    : [];

  return { assets, profile: profile ?? null, samples };
}

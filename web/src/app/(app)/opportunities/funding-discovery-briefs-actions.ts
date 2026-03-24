"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fundingDiscoveryBriefs } from "@/db/schema/tables";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";

const saveBriefSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, "Label is required").max(255),
  briefText: z
    .string()
    .trim()
    .min(20, "Brief must be at least 20 characters.")
    .max(8000),
});

export type SavedFundingBriefListItem = {
  id: string;
  label: string;
  briefText: string;
  lastRunAt: string | null;
  updatedAt: string;
};

export type FundingDiscoveryBriefsLoadResult = {
  briefs: SavedFundingBriefListItem[];
  /** Set when the query fails (e.g. migration not applied yet). Auth/redirect errors are not caught. */
  loadError: string | null;
};

export async function listFundingDiscoveryBriefs(): Promise<FundingDiscoveryBriefsLoadResult> {
  const { email } = await getSessionUserEmailOrRedirect();
  const userId = await getAppUserIdByEmail(email);
  if (!userId) {
    return { briefs: [], loadError: null };
  }

  try {
    const db = getServerDb();
    const rows = await db
      .select({
        id: fundingDiscoveryBriefs.id,
        label: fundingDiscoveryBriefs.label,
        briefText: fundingDiscoveryBriefs.briefText,
        lastRunAt: fundingDiscoveryBriefs.lastRunAt,
        updatedAt: fundingDiscoveryBriefs.updatedAt,
      })
      .from(fundingDiscoveryBriefs)
      .where(eq(fundingDiscoveryBriefs.userId, userId))
      .orderBy(desc(fundingDiscoveryBriefs.updatedAt));

    const briefs = rows.map((r) => ({
      id: r.id,
      label: r.label,
      briefText: r.briefText,
      lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
      updatedAt: r.updatedAt.toISOString(),
    }));
    return { briefs, loadError: null };
  } catch (e) {
    console.error("[listFundingDiscoveryBriefs]", e);
    return {
      briefs: [],
      loadError:
        "Saved briefs could not be loaded. If this persists, run database migrations (see DEPLOYMENT.md) so the funding_discovery_briefs table exists.",
    };
  }
}

export async function saveFundingDiscoveryBrief(
  raw: z.infer<typeof saveBriefSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const parsed = saveBriefSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid brief.",
      };
    }
    const { email } = await getSessionUserEmailOrRedirect();
    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }

    const db = getServerDb();
    const now = new Date();
    const { id, label, briefText } = parsed.data;

    if (id) {
      const updated = await db
        .update(fundingDiscoveryBriefs)
        .set({
          label,
          briefText,
          updatedAt: now,
        })
        .where(and(eq(fundingDiscoveryBriefs.id, id), eq(fundingDiscoveryBriefs.userId, userId)))
        .returning({ id: fundingDiscoveryBriefs.id });
      if (!updated[0]) {
        return { ok: false, error: "Brief not found or not yours." };
      }
      revalidatePath("/opportunities/discover");
      return { ok: true, id: updated[0].id };
    }

    const [inserted] = await db
      .insert(fundingDiscoveryBriefs)
      .values({
        userId,
        label,
        briefText,
        updatedAt: now,
      })
      .returning({ id: fundingDiscoveryBriefs.id });

    if (!inserted) {
      return { ok: false, error: "Could not save brief." };
    }
    revalidatePath("/opportunities/discover");
    return { ok: true, id: inserted.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save brief.",
    };
  }
}

export async function deleteFundingDiscoveryBrief(
  briefId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!z.string().uuid().safeParse(briefId).success) {
      return { ok: false, error: "Invalid brief id." };
    }
    const { email } = await getSessionUserEmailOrRedirect();
    const userId = await getAppUserIdByEmail(email);
    if (!userId) {
      return { ok: false, error: "Local user profile missing; reload and try again." };
    }

    const db = getServerDb();
    await db
      .delete(fundingDiscoveryBriefs)
      .where(
        and(eq(fundingDiscoveryBriefs.id, briefId), eq(fundingDiscoveryBriefs.userId, userId)),
      );
    revalidatePath("/opportunities/discover");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not delete brief.",
    };
  }
}

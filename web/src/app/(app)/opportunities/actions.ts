"use server";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  applicationConflicts,
  knowledgeAssets,
  opportunities,
  opportunityKnowledgeAssets,
  opportunityScores,
  submissionPacks,
  tasks,
  users,
  writingStyleProfiles,
  writingStyleSamples,
} from "@/db/schema/tables";
import { getServerDb } from "@/lib/db/server";
import { getAuthServer } from "@/lib/auth/server";
import { OPPORTUNITY_STATUSES } from "@/lib/opportunities/constants";
import {
  averageFit,
  recommendFromScores,
  scoreRowToInput,
  weightedOverall,
  type RecommendedAction,
} from "@/lib/opportunities/scoring-engine";
import {
  conflictQuickSchema,
  opportunityFormSchema,
  opportunityScoreFormSchema,
  packQuickSchema,
  taskQuickSchema,
} from "@/lib/opportunities/zod";

export type FormState = { error: string | null };

async function requireSessionUser() {
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) {
    redirect("/auth/sign-in");
  }
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

const knowledgeQuickSchema = z.object({
  opportunityId: z.string().uuid(),
  title: z.string().trim().min(2).max(512),
  url: z.string().trim().url(),
  sourceType: z.enum(["repository", "document", "file", "portal", "other"]),
  summary: z.string().trim().max(4000).optional().default(""),
  tags: z.string().trim().optional().default(""),
  relevanceNote: z.string().trim().max(2000).optional().default(""),
  priority: z.coerce.number().int().min(1).max(5).default(3),
});

const githubRepoQuickSchema = z.object({
  opportunityId: z.string().uuid(),
  repoUrl: z
    .string()
    .trim()
    .url()
    .regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i, {
      message: "Enter a GitHub repository URL like https://github.com/org/repo",
    }),
  summary: z.string().trim().max(4000).optional().default(""),
  relevanceNote: z.string().trim().max(2000).optional().default(""),
  priority: z.coerce.number().int().min(1).max(5).default(3),
});

function deriveGithubRepoTitle(repoUrl: string): string {
  try {
    const u = new URL(repoUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]} (GitHub repository)`;
    }
  } catch {
    // no-op
  }
  return "GitHub repository";
}

const opportunityKnowledgeLinkSchema = z.object({
  opportunityId: z.string().uuid(),
  knowledgeAssetId: z.string().uuid(),
  relevanceNote: z.string().trim().max(2000).optional().default(""),
  priority: z.coerce.number().int().min(1).max(5).default(3),
});

function formDataToOpportunityPayload(fd: FormData) {
  return {
    title: String(fd.get("title") ?? ""),
    summary: String(fd.get("summary") ?? ""),
    funderName: String(fd.get("funderName") ?? ""),
    closesAt: String(fd.get("closesAt") ?? ""),
    status: String(fd.get("status") ?? "draft"),
    ownerUserId: String(fd.get("ownerUserId") ?? ""),
    eligibilityNotes: String(fd.get("eligibilityNotes") ?? ""),
    internalNotes: String(fd.get("internalNotes") ?? ""),
    estimatedValue: String(fd.get("estimatedValue") ?? ""),
    currencyCode: String(fd.get("currencyCode") ?? "GBP"),
  };
}

export async function saveOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSessionUser();
  const parsed = opportunityFormSchema.safeParse(
    formDataToOpportunityPayload(formData),
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const db = getServerDb();
  const closesAt = parsed.data.closesAt ? new Date(parsed.data.closesAt) : null;
  const row = {
    title: parsed.data.title,
    summary: parsed.data.summary || null,
    funderName: parsed.data.funderName || null,
    closesAt,
    status: parsed.data.status,
    eligibilityNotes: parsed.data.eligibilityNotes || null,
    internalNotes: parsed.data.internalNotes || null,
    estimatedValue: parsed.data.estimatedValue ?? null,
    currencyCode: parsed.data.currencyCode,
    ownerUserId: parsed.data.ownerUserId ?? null,
    updatedAt: new Date(),
  };

  const idRaw = formData.get("id");
  const existingId =
    typeof idRaw === "string" && z.string().uuid().safeParse(idRaw).success
      ? idRaw
      : null;

  if (existingId) {
    await db
      .update(opportunities)
      .set(row)
      .where(eq(opportunities.id, existingId));
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${existingId}`);
    redirect(`/opportunities/${existingId}`);
  }

  const [inserted] = await db
    .insert(opportunities)
    .values(row)
    .returning({ id: opportunities.id });

  if (!inserted) {
    return { error: "Could not create opportunity." };
  }

  revalidatePath("/opportunities");
  redirect(`/opportunities/${inserted.id}`);
}

export async function deleteOpportunity(formData: FormData) {
  await requireSessionUser();
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string" || !z.string().uuid().safeParse(idRaw).success) {
    return;
  }
  const db = getServerDb();
  await db.delete(opportunities).where(eq(opportunities.id, idRaw));
  revalidatePath("/opportunities");
  redirect("/opportunities");
}

export async function saveOpportunityScore(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireSessionUser();
  const parsed = opportunityScoreFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid scoring fields.",
    };
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  const now = new Date();
  await db
    .insert(opportunityScores)
    .values({
      opportunityId: parsed.data.opportunityId,
      eligibilityFit: parsed.data.eligibilityFit ?? null,
      restormelFit: parsed.data.restormelFit ?? null,
      sophiaFit: parsed.data.sophiaFit ?? null,
      cashValue: parsed.data.cashValue ?? null,
      burnReductionValue: parsed.data.burnReductionValue ?? null,
      effortRequired: parsed.data.effortRequired ?? null,
      strategicValue: parsed.data.strategicValue ?? null,
      timeSensitivity: parsed.data.timeSensitivity ?? null,
      rationale: parsed.data.rationale || null,
      scoredByUserId: appUserId,
      scoredAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: opportunityScores.opportunityId,
      set: {
        eligibilityFit: parsed.data.eligibilityFit ?? null,
        restormelFit: parsed.data.restormelFit ?? null,
        sophiaFit: parsed.data.sophiaFit ?? null,
        cashValue: parsed.data.cashValue ?? null,
        burnReductionValue: parsed.data.burnReductionValue ?? null,
        effortRequired: parsed.data.effortRequired ?? null,
        strategicValue: parsed.data.strategicValue ?? null,
        timeSensitivity: parsed.data.timeSensitivity ?? null,
        rationale: parsed.data.rationale || null,
        scoredByUserId: appUserId,
        scoredAt: now,
        updatedAt: now,
      },
    });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  return { error: null };
}

export async function addTaskForOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSessionUser();
  const parsed = taskQuickSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid task.",
    };
  }

  const db = getServerDb();
  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  await db.insert(tasks).values({
    opportunityId: parsed.data.opportunityId,
    title: parsed.data.title,
    dueAt,
    status: parsed.data.status,
    updatedAt: new Date(),
  });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/deadlines");
  return { error: null };
}

export async function addPackForOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSessionUser();
  const parsed = packQuickSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid submission pack.",
    };
  }

  const db = getServerDb();
  await db.insert(submissionPacks).values({
    opportunityId: parsed.data.opportunityId,
    title: parsed.data.title,
    status: parsed.data.status,
    updatedAt: new Date(),
  });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/submission-packs");
  return { error: null };
}

export async function addConflictForOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSessionUser();
  const parsed = conflictQuickSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid conflict.",
    };
  }

  const db = getServerDb();
  await db.insert(applicationConflicts).values({
    opportunityId: parsed.data.opportunityId,
    title: parsed.data.title,
    detail: parsed.data.detail || null,
    severity: parsed.data.severity,
  });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  return { error: null };
}

export async function linkKnowledgeToOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSessionUser();
  const parsed = opportunityKnowledgeLinkSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid knowledge link input.",
    };
  }

  const db = getServerDb();
  await db
    .insert(opportunityKnowledgeAssets)
    .values({
      opportunityId: parsed.data.opportunityId,
      knowledgeAssetId: parsed.data.knowledgeAssetId,
      relevanceNote: parsed.data.relevanceNote || null,
      priority: parsed.data.priority,
    })
    .onConflictDoUpdate({
      target: [
        opportunityKnowledgeAssets.opportunityId,
        opportunityKnowledgeAssets.knowledgeAssetId,
      ],
      set: {
        relevanceNote: parsed.data.relevanceNote || null,
        priority: parsed.data.priority,
      },
    });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/knowledge");
  return { error: null };
}

export async function createAndLinkKnowledgeAsset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireSessionUser();
  const parsed = knowledgeQuickSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid knowledge asset quick-add.",
    };
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  const tags =
    parsed.data.tags.trim().length === 0
      ? null
      : parsed.data.tags
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);

  const [asset] = await db
    .insert(knowledgeAssets)
    .values({
      title: parsed.data.title,
      sourceType: parsed.data.sourceType,
      url: parsed.data.url,
      summary: parsed.data.summary || null,
      tags,
      createdByUserId: appUserId,
      updatedAt: new Date(),
    })
    .returning({ id: knowledgeAssets.id });

  if (!asset) {
    return { error: "Could not create knowledge asset." };
  }

  await db.insert(opportunityKnowledgeAssets).values({
    opportunityId: parsed.data.opportunityId,
    knowledgeAssetId: asset.id,
    relevanceNote: parsed.data.relevanceNote || null,
    priority: parsed.data.priority,
  });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/knowledge");
  return { error: null };
}

export async function createAndLinkGithubRepoAsset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireSessionUser();
  const parsed = githubRepoQuickSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid GitHub repository URL.",
    };
  }

  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  const [asset] = await db
    .insert(knowledgeAssets)
    .values({
      title: deriveGithubRepoTitle(parsed.data.repoUrl),
      sourceType: "repository",
      url: parsed.data.repoUrl,
      summary: parsed.data.summary || null,
      tags: ["github", "repository"],
      createdByUserId: appUserId,
      updatedAt: new Date(),
    })
    .returning({ id: knowledgeAssets.id });

  if (!asset) {
    return { error: "Could not create GitHub repository knowledge asset." };
  }

  await db.insert(opportunityKnowledgeAssets).values({
    opportunityId: parsed.data.opportunityId,
    knowledgeAssetId: asset.id,
    relevanceNote:
      parsed.data.relevanceNote || "Codebase and implementation context.",
    priority: parsed.data.priority,
  });

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/knowledge");
  return { error: null };
}

export async function deleteTaskForOpportunity(formData: FormData) {
  await requireSessionUser();
  const id = formData.get("id");
  const oppId = formData.get("opportunityId");
  if (typeof id !== "string" || typeof oppId !== "string") return;
  if (!z.string().uuid().safeParse(id).success) return;
  const db = getServerDb();
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath(`/opportunities/${oppId}`);
  revalidatePath("/deadlines");
}

export async function deletePackForOpportunity(formData: FormData) {
  await requireSessionUser();
  const id = formData.get("id");
  const oppId = formData.get("opportunityId");
  if (typeof id !== "string" || typeof oppId !== "string") return;
  if (!z.string().uuid().safeParse(id).success) return;
  const db = getServerDb();
  await db.delete(submissionPacks).where(eq(submissionPacks.id, id));
  revalidatePath(`/opportunities/${oppId}`);
  revalidatePath("/submission-packs");
  revalidatePath(`/submission-packs/${id}`);
}

export async function deleteConflictForOpportunity(formData: FormData) {
  await requireSessionUser();
  const id = formData.get("id");
  const oppId = formData.get("opportunityId");
  if (typeof id !== "string" || typeof oppId !== "string") return;
  if (!z.string().uuid().safeParse(id).success) return;
  const db = getServerDb();
  await db
    .delete(applicationConflicts)
    .where(eq(applicationConflicts.id, id));
  revalidatePath(`/opportunities/${oppId}`);
}

export async function unlinkKnowledgeForOpportunity(formData: FormData) {
  await requireSessionUser();
  const parsed = opportunityKnowledgeLinkSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    knowledgeAssetId: formData.get("knowledgeAssetId"),
    relevanceNote: "",
    priority: 3,
  });
  if (!parsed.success) return;

  const db = getServerDb();
  await db
    .delete(opportunityKnowledgeAssets)
    .where(
      and(
        eq(opportunityKnowledgeAssets.opportunityId, parsed.data.opportunityId),
        eq(opportunityKnowledgeAssets.knowledgeAssetId, parsed.data.knowledgeAssetId),
      ),
    );

  revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
  revalidatePath("/knowledge");
}

export async function loadUserOptions() {
  await requireSessionUser();
  const db = getServerDb();
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .orderBy(asc(users.displayName), asc(users.email));

  return rows.map((r) => ({
    id: r.id,
    label: r.displayName?.trim() || r.email,
  }));
}

export type OpportunityListRow = {
  id: string;
  title: string;
  funderName: string | null;
  status: (typeof opportunities.$inferSelect)["status"];
  closesAt: Date | null;
  estimatedValue: string | null;
  currencyCode: string;
  ownerName: string | null;
  ownerEmail: string | null;
  updatedAt: Date;
  overall: number | null;
  compositeFit: number | null;
  recommendation: RecommendedAction;
};

export async function loadOpportunitiesList(filters: {
  q?: string;
  status?: string;
  sort?: string;
}): Promise<OpportunityListRow[]> {
  await requireSessionUser();
  const db = getServerDb();
  const q = filters.q?.trim();
  const status = filters.status?.trim();
  const sort = filters.sort?.trim() ?? "pipeline";

  const conditions = [];
  if (status && status !== "all") {
    const parsedStatus = z.enum(OPPORTUNITY_STATUSES).safeParse(status);
    if (parsedStatus.success) {
      conditions.push(eq(opportunities.status, parsedStatus.data));
    }
  }
  if (q) {
    const pattern = `%${q.replace(/%/g, "\\%")}%`;
    conditions.push(
      or(
        ilike(opportunities.title, pattern),
        ilike(opportunities.summary, pattern),
        ilike(opportunities.funderName, pattern),
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
      id: opportunities.id,
      title: opportunities.title,
      funderName: opportunities.funderName,
      status: opportunities.status,
      closesAt: opportunities.closesAt,
      estimatedValue: opportunities.estimatedValue,
      currencyCode: opportunities.currencyCode,
      ownerName: users.displayName,
      ownerEmail: users.email,
      updatedAt: opportunities.updatedAt,
      eligibilityFit: opportunityScores.eligibilityFit,
      restormelFit: opportunityScores.restormelFit,
      sophiaFit: opportunityScores.sophiaFit,
      cashValue: opportunityScores.cashValue,
      burnReductionValue: opportunityScores.burnReductionValue,
      effortRequired: opportunityScores.effortRequired,
      strategicValue: opportunityScores.strategicValue,
      timeSensitivity: opportunityScores.timeSensitivity,
    })
    .from(opportunities)
    .leftJoin(users, eq(opportunities.ownerUserId, users.id))
    .leftJoin(
      opportunityScores,
      eq(opportunities.id, opportunityScores.opportunityId),
    )
    .where(where);

  const enriched: OpportunityListRow[] = rows.map((r) => {
    const scoring = scoreRowToInput({
      eligibilityFit: r.eligibilityFit,
      restormelFit: r.restormelFit,
      sophiaFit: r.sophiaFit,
      cashValue: r.cashValue,
      burnReductionValue: r.burnReductionValue,
      effortRequired: r.effortRequired,
      strategicValue: r.strategicValue,
      timeSensitivity: r.timeSensitivity,
    });
    const overall = weightedOverall(scoring);
    const compositeFit = averageFit(scoring);
    const recommendation = recommendFromScores({ overall, scoring });
    return {
      id: r.id,
      title: r.title,
      funderName: r.funderName,
      status: r.status,
      closesAt: r.closesAt,
      estimatedValue: r.estimatedValue,
      currencyCode: r.currencyCode,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      updatedAt: r.updatedAt,
      overall,
      compositeFit,
      recommendation,
    };
  });

  if (sort === "deadline") {
    enriched.sort((a, b) => {
      const ta = a.closesAt ? new Date(a.closesAt).getTime() : Infinity;
      const tb = b.closesAt ? new Date(b.closesAt).getTime() : Infinity;
      return ta - tb;
    });
  } else if (sort === "updated") {
    enriched.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } else {
    const rank: Record<RecommendedAction, number> = {
      apply_now: 4,
      prepare: 3,
      monitor: 2,
      ignore: 1,
    };
    enriched.sort((a, b) => {
      const ao = a.overall ?? -1;
      const bo = b.overall ?? -1;
      if (bo !== ao) return bo - ao;
      const ar = rank[a.recommendation];
      const br = rank[b.recommendation];
      if (br !== ar) return br - ar;
      const ta = a.closesAt ? new Date(a.closesAt).getTime() : Infinity;
      const tb = b.closesAt ? new Date(b.closesAt).getTime() : Infinity;
      return ta - tb;
    });
  }

  return enriched;
}

export async function loadOpportunityDetail(id: string) {
  await requireSessionUser();
  if (!z.string().uuid().safeParse(id).success) {
    return null;
  }

  const db = getServerDb();

  const [oppRow] = await db
    .select({
      opportunity: opportunities,
      ownerName: users.displayName,
      ownerEmail: users.email,
    })
    .from(opportunities)
    .leftJoin(users, eq(opportunities.ownerUserId, users.id))
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!oppRow) return null;

  const [score] = await db
    .select()
    .from(opportunityScores)
    .where(eq(opportunityScores.opportunityId, id))
    .limit(1);

  const packRows = await db
    .select()
    .from(submissionPacks)
    .where(eq(submissionPacks.opportunityId, id))
    .orderBy(desc(submissionPacks.updatedAt));

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.opportunityId, id))
    .orderBy(asc(tasks.dueAt), asc(tasks.createdAt));

  const conflictRows = await db
    .select()
    .from(applicationConflicts)
    .where(eq(applicationConflicts.opportunityId, id))
    .orderBy(desc(applicationConflicts.createdAt));

  const knowledgeRows = await db
    .select({
      opportunityId: opportunityKnowledgeAssets.opportunityId,
      knowledgeAssetId: opportunityKnowledgeAssets.knowledgeAssetId,
      relevanceNote: opportunityKnowledgeAssets.relevanceNote,
      priority: opportunityKnowledgeAssets.priority,
      linkedAt: opportunityKnowledgeAssets.createdAt,
      title: knowledgeAssets.title,
      sourceType: knowledgeAssets.sourceType,
      url: knowledgeAssets.url,
      summary: knowledgeAssets.summary,
      tags: knowledgeAssets.tags,
    })
    .from(opportunityKnowledgeAssets)
    .innerJoin(
      knowledgeAssets,
      eq(opportunityKnowledgeAssets.knowledgeAssetId, knowledgeAssets.id),
    )
    .where(eq(opportunityKnowledgeAssets.opportunityId, id))
    .orderBy(desc(opportunityKnowledgeAssets.priority), asc(knowledgeAssets.title));

  const availableKnowledge = await db
    .select({
      id: knowledgeAssets.id,
      title: knowledgeAssets.title,
      sourceType: knowledgeAssets.sourceType,
      url: knowledgeAssets.url,
    })
    .from(knowledgeAssets)
    .orderBy(asc(knowledgeAssets.title));

  const [styleProfile] =
    oppRow.opportunity.ownerUserId == null
      ? []
      : await db
          .select({
            id: writingStyleProfiles.id,
            profileName: writingStyleProfiles.profileName,
            voiceDescription: writingStyleProfiles.voiceDescription,
            styleGuardrailsMd: writingStyleProfiles.styleGuardrailsMd,
            bannedPhrases: writingStyleProfiles.bannedPhrases,
            preferredStructure: writingStyleProfiles.preferredStructure,
          })
          .from(writingStyleProfiles)
          .where(eq(writingStyleProfiles.ownerUserId, oppRow.opportunity.ownerUserId))
          .limit(1);

  const styleSamples = styleProfile
    ? await db
        .select({
          id: writingStyleSamples.id,
          title: writingStyleSamples.title,
          sampleText: writingStyleSamples.sampleText,
          sourceUrl: writingStyleSamples.sourceUrl,
        })
        .from(writingStyleSamples)
        .where(eq(writingStyleSamples.profileId, styleProfile.id))
        .orderBy(desc(writingStyleSamples.createdAt))
        .limit(5)
    : [];

  return {
    ...oppRow,
    score: score ?? null,
    packs: packRows,
    taskList: taskRows,
    conflicts: conflictRows,
    knowledge: knowledgeRows,
    availableKnowledge,
    styleProfile: styleProfile ?? null,
    styleSamples,
  };
}

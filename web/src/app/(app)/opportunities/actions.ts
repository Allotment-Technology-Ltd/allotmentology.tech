"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
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
import { DEFAULT_APPLICATION_FORMS_MD } from "@/lib/submission-packs/application-forms-template";

import { runMitchellGrantIntake } from "./opportunity-ai-actions";

export type FormState = { error: string | null };

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code =
    (err as { code?: unknown }).code ??
    ((err as { cause?: { code?: unknown } }).cause?.code ?? null);
  return code === "42703";
}

async function loadOpportunitiesColumnSet(db: ReturnType<typeof getServerDb>): Promise<Set<string>> {
  const result = await db.execute(sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'opportunities'
  `);
  const rows = (result as { rows?: Array<{ column_name?: string }> }).rows ?? [];
  return new Set(
    rows
      .map((r) => (typeof r.column_name === "string" ? r.column_name : null))
      .filter((v): v is string => Boolean(v)),
  );
}

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
    grantUrl: String(fd.get("grantUrl") ?? ""),
    productFitAssessmentMd: String(fd.get("productFitAssessmentMd") ?? ""),
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
  const opportunitiesColumns = await loadOpportunitiesColumnSet(db);
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
    grantUrl: parsed.data.grantUrl ?? null,
    productFitAssessmentMd: parsed.data.productFitAssessmentMd?.trim()
      ? parsed.data.productFitAssessmentMd.trim()
      : null,
    updatedAt: new Date(),
  };

  const idRaw = formData.get("id");
  const existingId =
    typeof idRaw === "string" && z.string().uuid().safeParse(idRaw).success
      ? idRaw
      : null;

  const redirectTo =
    typeof formData.get("redirectTo") === "string"
      ? formData.get("redirectTo")
      : null;
  const mitchellAfterSave = formData.get("mitchellAfterSave") === "1";

  if (existingId) {
    try {
      await db
        .update(opportunities)
        .set(row)
        .where(eq(opportunities.id, existingId));
    } catch (e) {
      if (!isMissingColumnError(e)) throw e;
      // Schema-aware fallback: only set columns that exist in this environment.
      const legacyUpdate: Record<string, unknown> = {};
      if (opportunitiesColumns.has("title")) legacyUpdate.title = row.title;
      if (opportunitiesColumns.has("summary")) legacyUpdate.summary = row.summary;
      if (opportunitiesColumns.has("funder_name")) legacyUpdate.funderName = row.funderName;
      if (opportunitiesColumns.has("closes_at")) legacyUpdate.closesAt = row.closesAt;
      if (opportunitiesColumns.has("status")) legacyUpdate.status = row.status;
      if (opportunitiesColumns.has("owner_user_id")) legacyUpdate.ownerUserId = row.ownerUserId;
      if (opportunitiesColumns.has("updated_at")) legacyUpdate.updatedAt = row.updatedAt;

      await db
        .update(opportunities)
        .set(legacyUpdate as never)
        .where(eq(opportunities.id, existingId));
    }
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${existingId}`);
    revalidatePath(`/opportunities/${existingId}/edit`);

    if (mitchellAfterSave && parsed.data.grantUrl && opportunitiesColumns.has("grant_url")) {
      await runMitchellGrantIntake(existingId);
    }

    if (redirectTo === "edit") {
      redirect(`/opportunities/${existingId}/edit`);
    }
    redirect(`/opportunities/${existingId}`);
  }

  let inserted: { id: string } | undefined;
  try {
    const [created] = await db
      .insert(opportunities)
      .values(row)
      .returning({ id: opportunities.id });
    inserted = created;
  } catch (e) {
    if (!isMissingColumnError(e)) throw e;
    // Schema-aware fallback: only insert columns that exist in this environment.
    const legacyInsert: Record<string, unknown> = {};
    if (opportunitiesColumns.has("title")) legacyInsert.title = row.title;
    if (opportunitiesColumns.has("summary")) legacyInsert.summary = row.summary;
    if (opportunitiesColumns.has("funder_name")) legacyInsert.funderName = row.funderName;
    if (opportunitiesColumns.has("closes_at")) legacyInsert.closesAt = row.closesAt;
    if (opportunitiesColumns.has("status")) legacyInsert.status = row.status;
    if (opportunitiesColumns.has("eligibility_notes")) {
      legacyInsert.eligibilityNotes = row.eligibilityNotes;
    }
    if (opportunitiesColumns.has("internal_notes")) {
      legacyInsert.internalNotes = row.internalNotes;
    }
    if (opportunitiesColumns.has("estimated_value")) {
      legacyInsert.estimatedValue = row.estimatedValue;
    }
    if (opportunitiesColumns.has("currency_code")) legacyInsert.currencyCode = row.currencyCode;
    if (opportunitiesColumns.has("owner_user_id")) legacyInsert.ownerUserId = row.ownerUserId;
    if (opportunitiesColumns.has("grant_url")) legacyInsert.grantUrl = row.grantUrl;
    if (opportunitiesColumns.has("product_fit_assessment_md")) {
      legacyInsert.productFitAssessmentMd = row.productFitAssessmentMd;
    }
    if (opportunitiesColumns.has("updated_at")) legacyInsert.updatedAt = row.updatedAt;

    if (!("title" in legacyInsert)) {
      return { error: "Could not create opportunity: schema missing title column." };
    }

    const [legacyRow] = await db
      .insert(opportunities)
      .values(legacyInsert as never)
      .returning({ id: opportunities.id });
    inserted = legacyRow;
  }

  if (!inserted) {
    return { error: "Could not create opportunity." };
  }

  revalidatePath("/opportunities");

  if (parsed.data.grantUrl && opportunitiesColumns.has("grant_url")) {
    const mitchell = await runMitchellGrantIntake(inserted.id);
    if (!mitchell.ok) {
      console.warn("[saveOpportunity] Mitchell intake:", mitchell.error);
    }
  }

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
    applicationFormsMd: DEFAULT_APPLICATION_FORMS_MD,
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

  let oppRow:
    | {
        opportunity: typeof opportunities.$inferSelect;
        ownerName: string | null;
        ownerEmail: string | null;
      }
    | undefined;
  try {
    const [row] = await db
      .select({
        opportunity: opportunities,
        ownerName: users.displayName,
        ownerEmail: users.email,
      })
      .from(opportunities)
      .leftJoin(users, eq(opportunities.ownerUserId, users.id))
      .where(eq(opportunities.id, id))
      .limit(1);
    oppRow = row;
  } catch (e) {
    if (!isMissingColumnError(e)) throw e;
    // Legacy-schema fallback: fetch core columns only and pad newer fields.
    const legacy = await db.execute<{
      id: string;
      title: string;
      summary: string | null;
      funder_name: string | null;
      closes_at: Date | string | null;
      status: (typeof opportunities.$inferSelect)["status"];
      owner_user_id: string | null;
      created_at: Date | string;
      updated_at: Date | string;
      owner_name: string | null;
      owner_email: string | null;
    }>(sql`
      select
        o.id,
        o.title,
        o.summary,
        o.funder_name,
        o.closes_at,
        o.status,
        o.owner_user_id,
        o.created_at,
        o.updated_at,
        u.display_name as owner_name,
        u.email as owner_email
      from opportunities o
      left join users u on u.id = o.owner_user_id
      where o.id = ${id}
      limit 1
    `);
    const lr = legacy.rows[0];
    if (!lr) return null;
    oppRow = {
      ownerName: lr.owner_name ?? null,
      ownerEmail: lr.owner_email ?? null,
      opportunity: {
        id: lr.id,
        title: lr.title,
        summary: lr.summary,
        funderName: lr.funder_name,
        closesAt: lr.closes_at ? new Date(lr.closes_at) : null,
        status: lr.status,
        ownerUserId: lr.owner_user_id,
        eligibilityNotes: null,
        internalNotes: null,
        estimatedValue: null,
        currencyCode: "GBP",
        grantUrl: null,
        productFitAssessmentMd: null,
        mitchellBriefMd: null,
        mitchellSectionDraftMd: null,
        mitchellSectionFollowupMd: null,
        mitchellQaQuestionMd: null,
        mitchellQaNotesMd: null,
        mitchellQaResponseMd: null,
        createdAt: new Date(lr.created_at),
        updatedAt: new Date(lr.updated_at),
      },
    };
  }

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

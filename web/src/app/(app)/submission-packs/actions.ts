"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { opportunities, submissionPacks } from "@/db/schema/tables";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";
import { evaluateSubmissionPackReadiness } from "@/lib/submission-packs/readiness";
import { submissionPackFormSchema } from "@/lib/submission-packs/zod";

export type PackFormState = { error: string | null; issues?: string[] };

async function requireSessionUser() {
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) {
    redirect("/auth/sign-in");
  }
  return data.user;
}

function formDataToPackPayload(fd: FormData) {
  return {
    id: String(fd.get("id") ?? ""),
    title: String(fd.get("title") ?? ""),
    status: String(fd.get("status") ?? "draft"),
    workingThesis: String(fd.get("workingThesis") ?? ""),
    projectFraming: String(fd.get("projectFraming") ?? ""),
    summary100: String(fd.get("summary100") ?? ""),
    summary250: String(fd.get("summary250") ?? ""),
    draftAnswersMd: String(fd.get("draftAnswersMd") ?? ""),
    missingInputsMd: String(fd.get("missingInputsMd") ?? ""),
    risksMd: String(fd.get("risksMd") ?? ""),
    checklistMd: String(fd.get("checklistMd") ?? ""),
  };
}

export async function saveSubmissionPack(
  _prev: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireSessionUser();
  const parsed = submissionPackFormSchema.safeParse(formDataToPackPayload(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const readinessPayload = {
    workingThesis: parsed.data.workingThesis,
    projectFraming: parsed.data.projectFraming,
    summary100: parsed.data.summary100,
    summary250: parsed.data.summary250,
    draftAnswersMd: parsed.data.draftAnswersMd,
    missingInputsMd: parsed.data.missingInputsMd,
    risksMd: parsed.data.risksMd,
    checklistMd: parsed.data.checklistMd,
  };

  if (parsed.data.status === "ready" || parsed.data.status === "submitted") {
    const { ok, issues } = evaluateSubmissionPackReadiness(readinessPayload);
    if (!ok) {
      return {
        error: "Pack is not ready for this status yet.",
        issues,
      };
    }
  }

  const db = getServerDb();
  const now = new Date();

  const [existing] = await db
    .select({ opportunityId: submissionPacks.opportunityId })
    .from(submissionPacks)
    .where(eq(submissionPacks.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return { error: "Submission pack not found." };
  }

  await db
    .update(submissionPacks)
    .set({
      title: parsed.data.title,
      status: parsed.data.status,
      workingThesis: parsed.data.workingThesis,
      projectFraming: parsed.data.projectFraming,
      summary100: parsed.data.summary100,
      summary250: parsed.data.summary250,
      draftAnswersMd: parsed.data.draftAnswersMd,
      missingInputsMd: parsed.data.missingInputsMd,
      risksMd: parsed.data.risksMd,
      checklistMd: parsed.data.checklistMd,
      updatedAt: now,
    })
    .where(eq(submissionPacks.id, parsed.data.id));

  revalidatePath("/submission-packs");
  revalidatePath(`/submission-packs/${parsed.data.id}`);
  revalidatePath(`/opportunities/${existing.opportunityId}`);
  return { error: null };
}

export async function loadSubmissionPacksIndex() {
  await requireSessionUser();
  const db = getServerDb();
  return db
    .select({
      pack: submissionPacks,
      opportunityTitle: opportunities.title,
      funderName: opportunities.funderName,
    })
    .from(submissionPacks)
    .innerJoin(
      opportunities,
      eq(submissionPacks.opportunityId, opportunities.id),
    )
    .orderBy(desc(submissionPacks.updatedAt));
}

export async function loadSubmissionPackDetail(packId: string) {
  await requireSessionUser();
  if (!z.string().uuid().safeParse(packId).success) {
    return null;
  }
  const db = getServerDb();
  const [row] = await db
    .select({
      pack: submissionPacks,
      opportunityTitle: opportunities.title,
      opportunityId: opportunities.id,
      funderName: opportunities.funderName,
    })
    .from(submissionPacks)
    .innerJoin(
      opportunities,
      eq(submissionPacks.opportunityId, opportunities.id),
    )
    .where(eq(submissionPacks.id, packId))
    .limit(1);
  return row ?? null;
}

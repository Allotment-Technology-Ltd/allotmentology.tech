"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { submissionPacks } from "@/db/schema/tables";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";
import { DEFAULT_APPLICATION_FORMS_MD } from "@/lib/submission-packs/application-forms-template";
import { evaluateSubmissionPackReadiness } from "@/lib/submission-packs/readiness";
import { submissionPackFormSchema } from "@/lib/submission-packs/zod";
import { generatePackDraftAi } from "./pack-ai-actions";

export type PackFormState = { error: string | null; issues?: string[] };
export type PackAiFormState = {
  error: string | null;
  model?: string;
  logId?: string;
  confidence?: number;
  citationsNeeded?: string[];
  bannedPhraseHits?: string[];
};

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
    applicationFormsMd: String(fd.get("applicationFormsMd") ?? ""),
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
      applicationFormsMd: parsed.data.applicationFormsMd,
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

export async function resetApplicationFormsToDefault(
  _prev: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireSessionUser();
  const packIdRaw = formData.get("packId");
  if (typeof packIdRaw !== "string" || !z.string().uuid().safeParse(packIdRaw).success) {
    return { error: "Invalid pack id." };
  }

  const db = getServerDb();
  const [existing] = await db
    .select({ opportunityId: submissionPacks.opportunityId })
    .from(submissionPacks)
    .where(eq(submissionPacks.id, packIdRaw))
    .limit(1);

  if (!existing) {
    return { error: "Submission pack not found." };
  }

  await db
    .update(submissionPacks)
    .set({
      applicationFormsMd: DEFAULT_APPLICATION_FORMS_MD,
      updatedAt: new Date(),
    })
    .where(eq(submissionPacks.id, packIdRaw));

  revalidatePath("/submission-packs");
  revalidatePath(`/submission-packs/${packIdRaw}`);
  revalidatePath(`/opportunities/${existing.opportunityId}`);
  return { error: null };
}

/** Convenience for client components (e.g. reset button). */
export async function resetApplicationFormsByPackId(packId: string): Promise<PackFormState> {
  const fd = new FormData();
  fd.set("packId", packId);
  return resetApplicationFormsToDefault({ error: null }, fd);
}

export async function runWritingAgentForPack(
  _prev: PackAiFormState,
  formData: FormData,
): Promise<PackAiFormState> {
  await requireSessionUser();
  const packIdRaw = formData.get("packId");
  if (typeof packIdRaw !== "string" || !z.string().uuid().safeParse(packIdRaw).success) {
    return { error: "Invalid pack id." };
  }

  const ai = await generatePackDraftAi(packIdRaw);
  if (!ai.ok) {
    return { error: ai.error };
  }

  const db = getServerDb();
  const [existing] = await db
    .select({
      id: submissionPacks.id,
      draftAnswersMd: submissionPacks.draftAnswersMd,
      missingInputsMd: submissionPacks.missingInputsMd,
      risksMd: submissionPacks.risksMd,
    })
    .from(submissionPacks)
    .where(eq(submissionPacks.id, packIdRaw))
    .limit(1);

  if (!existing) {
    return { error: "Submission pack not found." };
  }

  const draftAnswersMd = [
    ai.fragments.working_thesis ? `## Working thesis\n${ai.fragments.working_thesis}` : null,
    ai.fragments.project_framing ? `## Project framing\n${ai.fragments.project_framing}` : null,
    ai.fragments.summary_100 ? `## Summary (100)\n${ai.fragments.summary_100}` : null,
    ai.fragments.summary_250 ? `## Summary (250)\n${ai.fragments.summary_250}` : null,
    ai.fragments.draft_answers_md
      ? `## Draft answers\n${ai.fragments.draft_answers_md}`
      : Object.entries(ai.fragments)
          .filter(
            ([k]) =>
              !["working_thesis", "project_framing", "summary_100", "summary_250"].includes(k),
          )
          .map(([k, v]) => `## ${k.replaceAll("_", " ")}\n${v}`)
          .join("\n\n"),
  ]
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .join("\n\n");

  const missingInputsMd =
    ai.missingInputs.length === 0
      ? existing.missingInputsMd
      : ai.missingInputs.map((i) => `- ${i}`).join("\n");

  const risksMd =
    ai.risks.length === 0 ? existing.risksMd : ai.risks.map((i) => `- ${i}`).join("\n");

  await db
    .update(submissionPacks)
    .set({
      workingThesis: ai.fragments.working_thesis ?? "",
      projectFraming: ai.fragments.project_framing ?? "",
      summary100: ai.fragments.summary_100 ?? "",
      summary250: ai.fragments.summary_250 ?? "",
      draftAnswersMd: draftAnswersMd || existing.draftAnswersMd,
      missingInputsMd,
      risksMd,
      updatedAt: new Date(),
    })
    .where(eq(submissionPacks.id, packIdRaw));

  revalidatePath("/submission-packs");
  revalidatePath(`/submission-packs/${packIdRaw}`);
  return {
    error: null,
    model: ai.model,
    logId: ai.logId,
    confidence: ai.confidence,
    citationsNeeded: ai.citationsNeeded,
    bannedPhraseHits: ai.bannedPhraseHits,
  };
}

import "server-only";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { opportunities, submissionPacks } from "@/db/schema/tables";
import { getSessionUserEmailOrRedirect } from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";

/** RSC / route handlers — not Server Actions (see `submission-packs/actions.ts`). */
export async function loadSubmissionPacksIndex() {
  await getSessionUserEmailOrRedirect();
  const db = getServerDb();
  /**
   * Select only columns needed for the list. Avoid `select({ pack: submissionPacks })`, which
   * requests every Drizzle column — if production is behind migrations (e.g. missing
   * `application_forms_md`), the page would hard-crash with a DB error.
   */
  return db
    .select({
      id: submissionPacks.id,
      title: submissionPacks.title,
      status: submissionPacks.status,
      updatedAt: submissionPacks.updatedAt,
      opportunityId: submissionPacks.opportunityId,
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

export type SubmissionPackIndexRow = Awaited<
  ReturnType<typeof loadSubmissionPacksIndex>
>[number];

export async function loadSubmissionPackDetail(packId: string) {
  await getSessionUserEmailOrRedirect();
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

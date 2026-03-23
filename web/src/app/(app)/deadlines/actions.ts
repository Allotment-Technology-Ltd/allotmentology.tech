"use server";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import {
  opportunities,
  submissionPacks,
  tasks,
  users,
} from "@/db/schema/tables";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";
import {
  taskDeadlineBucket,
  type DeadlineBucket,
} from "@/lib/tasks/deadline-buckets";

async function requireSessionUser() {
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) {
    redirect("/auth/sign-in");
  }
  return data.user;
}

export type DeadlineTaskRow = {
  task: typeof tasks.$inferSelect;
  opportunityTitle: string | null;
  opportunityId: string | null;
  funderName: string | null;
  closesAt: Date | null;
  assigneeLabel: string | null;
  linkedPackTitle: string | null;
  linkedPackId: string | null;
  bucket: DeadlineBucket;
};

export type PackGapSnippet = {
  packId: string;
  packTitle: string;
  excerpt: string;
};

export async function loadDeadlinesView(): Promise<{
  rows: DeadlineTaskRow[];
  gapsByOpportunity: Record<string, PackGapSnippet[]>;
}> {
  await requireSessionUser();
  const db = getServerDb();

  const baseRows = await db
    .select({
      task: tasks,
      opportunityTitle: opportunities.title,
      opportunityId: opportunities.id,
      funderName: opportunities.funderName,
      closesAt: opportunities.closesAt,
      assigneeDisplay: users.displayName,
      assigneeEmail: users.email,
      linkedPackTitle: submissionPacks.title,
      linkedPackId: submissionPacks.id,
    })
    .from(tasks)
    .leftJoin(opportunities, eq(tasks.opportunityId, opportunities.id))
    .leftJoin(users, eq(tasks.assigneeUserId, users.id))
    .leftJoin(
      submissionPacks,
      eq(tasks.submissionPackId, submissionPacks.id),
    )
    .orderBy(asc(tasks.dueAt), asc(tasks.createdAt));

  const rows: DeadlineTaskRow[] = baseRows.map((r) => {
    const assigneeLabel =
      r.assigneeDisplay?.trim() ||
      r.assigneeEmail?.trim() ||
      null;
    return {
      task: r.task,
      opportunityTitle: r.opportunityTitle,
      opportunityId: r.opportunityId,
      funderName: r.funderName,
      closesAt: r.closesAt,
      assigneeLabel,
      linkedPackTitle: r.linkedPackTitle,
      linkedPackId: r.linkedPackId,
      bucket: taskDeadlineBucket(r.task.dueAt, r.task.status),
    };
  });

  const oppIds = [
    ...new Set(
      rows
        .map((r) => r.opportunityId)
        .filter((id): id is string => id != null),
    ),
  ];

  const gapsByOpportunity: Record<string, PackGapSnippet[]> = {};

  if (oppIds.length > 0) {
    const packRows = await db
      .select({
        opportunityId: submissionPacks.opportunityId,
        id: submissionPacks.id,
        title: submissionPacks.title,
        missingInputsMd: submissionPacks.missingInputsMd,
      })
      .from(submissionPacks)
      .where(inArray(submissionPacks.opportunityId, oppIds))
      .orderBy(desc(submissionPacks.updatedAt));

    for (const p of packRows) {
      if (p.missingInputsMd.trim().length <= 4) continue;
      const raw = p.missingInputsMd.trim().replace(/\s+/g, " ");
      const excerpt = raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
      if (!excerpt) continue;
      const list = gapsByOpportunity[p.opportunityId] ?? [];
      list.push({
        packId: p.id,
        packTitle: p.title,
        excerpt,
      });
      gapsByOpportunity[p.opportunityId] = list;
    }
  }

  return { rows, gapsByOpportunity };
}

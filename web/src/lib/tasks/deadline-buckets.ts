import type { TaskStatus } from "@/lib/opportunities/constants";

export type DeadlineBucket =
  | "overdue"
  | "due_0_7"
  | "due_8_14"
  | "later"
  | "no_due"
  | "done";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Classify a task for the deadlines view.
 * - **due_0_7**: due date within the next 7 calendar days from today (including today).
 * - **due_8_14**: due between day 8 and day 14 ahead (second week window).
 */
export function taskDeadlineBucket(
  dueAt: Date | null | undefined,
  status: TaskStatus,
  now: Date = new Date(),
): DeadlineBucket {
  if (status === "done") return "done";
  if (dueAt == null || Number.isNaN(new Date(dueAt).getTime())) {
    return "no_due";
  }
  const today = startOfLocalDay(now);
  const dueDay = startOfLocalDay(new Date(dueAt));
  const diffDays = Math.round(
    (dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= 6) return "due_0_7";
  if (diffDays <= 13) return "due_8_14";
  return "later";
}

export const DEADLINE_BUCKET_LABEL: Record<
  Exclude<DeadlineBucket, "done" | "no_due">,
  string
> = {
  overdue: "Overdue",
  due_0_7: "Due in the next 7 days",
  due_8_14: "Due in 8–14 days",
  later: "Due later",
};

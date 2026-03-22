import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import {
  TASK_STATUS_LABEL,
  type TaskStatus,
} from "@/lib/opportunities/constants";
import { formatDateOnly } from "@/lib/format";
import {
  DEADLINE_BUCKET_LABEL,
  type DeadlineBucket,
} from "@/lib/tasks/deadline-buckets";

import { loadDeadlinesView, type DeadlineTaskRow, type PackGapSnippet } from "./actions";

export const dynamic = "force-dynamic";

const URGENT_BUCKETS: DeadlineBucket[] = ["overdue", "due_0_7", "due_8_14"];

function sortInBucket(a: DeadlineTaskRow, b: DeadlineTaskRow): number {
  if (a.bucket !== b.bucket) return 0;
  const ad = a.task.dueAt ? new Date(a.task.dueAt).getTime() : Infinity;
  const bd = b.task.dueAt ? new Date(b.task.dueAt).getTime() : Infinity;
  if (a.bucket === "overdue") return ad - bd;
  if (
    a.bucket === "due_0_7" ||
    a.bucket === "due_8_14" ||
    a.bucket === "later"
  ) {
    return ad - bd;
  }
  if (a.bucket === "no_due") {
    return (
      new Date(b.task.createdAt).getTime() -
      new Date(a.task.createdAt).getTime()
    );
  }
  if (a.bucket === "done") {
    return (
      new Date(b.task.updatedAt).getTime() -
      new Date(a.task.updatedAt).getTime()
    );
  }
  return 0;
}

function groupByBucket(rows: DeadlineTaskRow[]): Map<DeadlineBucket, DeadlineTaskRow[]> {
  const m = new Map<DeadlineBucket, DeadlineTaskRow[]>();
  for (const r of rows) {
    const list = m.get(r.bucket) ?? [];
    list.push(r);
    m.set(r.bucket, list);
  }
  for (const list of m.values()) {
    list.sort(sortInBucket);
  }
  return m;
}

function UrgencyChrome({ bucket }: { bucket: DeadlineBucket }) {
  if (bucket === "overdue") {
    return (
      <span className="rounded-full bg-red-950/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-red-200 ring-1 ring-red-800/60">
        Overdue
      </span>
    );
  }
  if (bucket === "due_0_7") {
    return (
      <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-100 ring-1 ring-amber-800/50">
        Next 7 days
      </span>
    );
  }
  if (bucket === "due_8_14") {
    return (
      <span className="rounded-full bg-yellow-950/50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-yellow-100/90 ring-1 ring-yellow-900/40">
        Next 8–14 days
      </span>
    );
  }
  return null;
}

function TaskRow(props: {
  row: DeadlineTaskRow;
  gaps: PackGapSnippet[] | undefined;
  showGaps: boolean;
}) {
  const { row: r, gaps, showGaps } = props;
  const t = r.task;
  const status = t.status as TaskStatus;

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyChrome bucket={r.bucket} />
            <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300">
              {TASK_STATUS_LABEL[status]}
            </span>
          </div>
          <p className="mt-2 font-medium text-zinc-100">{t.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
            <span>
              Due:{" "}
              {t.dueAt ? (
                <span className="text-zinc-300">{formatDateOnly(t.dueAt)}</span>
              ) : (
                <span className="text-zinc-500">Not set</span>
              )}
            </span>
            {r.assigneeLabel ? (
              <span>
                Assignee:{" "}
                <span className="text-zinc-400">{r.assigneeLabel}</span>
              </span>
            ) : null}
            {r.linkedPackTitle ? (
              <span>
                Pack:{" "}
                {r.linkedPackId ? (
                  <Link
                    href={`/submission-packs/${r.linkedPackId}`}
                    className="text-sky-400 hover:underline"
                  >
                    {r.linkedPackTitle}
                  </Link>
                ) : (
                  r.linkedPackTitle
                )}
              </span>
            ) : null}
          </div>
          {r.opportunityTitle ? (
            <p className="mt-2 text-sm text-zinc-400">
              Opportunity:{" "}
              {r.opportunityId ? (
                <Link
                  href={`/opportunities/${r.opportunityId}#tasks`}
                  className="text-sky-400 hover:underline"
                >
                  {r.opportunityTitle}
                </Link>
              ) : (
                r.opportunityTitle
              )}
              {r.funderName ? ` · ${r.funderName}` : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No opportunity linked.</p>
          )}
          {r.closesAt ? (
            <p className="mt-1 text-xs text-zinc-600">
              Opportunity closes {formatDateOnly(r.closesAt)}
            </p>
          ) : null}
        </div>
      </div>
      {showGaps && gaps && gaps.length > 0 ? (
        <div className="mt-3 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Pack — missing inputs (founder / team)
          </p>
          <ul className="mt-2 space-y-2">
            {gaps.map((g) => (
              <li
                key={g.packId}
                className="rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-xs leading-relaxed text-zinc-400"
              >
                <Link
                  href={`/submission-packs/${g.packId}`}
                  className="font-medium text-sky-400 hover:underline"
                >
                  {g.packTitle}
                </Link>
                <span className="text-zinc-500"> — </span>
                <span>{g.excerpt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function Section(props: {
  title: string;
  description?: string;
  bucket: DeadlineBucket;
  rows: DeadlineTaskRow[];
  gapsByOpportunity: Record<string, PackGapSnippet[]>;
}) {
  if (props.rows.length === 0) return null;
  const showGaps = URGENT_BUCKETS.includes(props.bucket);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-medium text-zinc-100">{props.title}</h2>
        {props.description ? (
          <p className="mt-1 text-sm text-zinc-500">{props.description}</p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {props.rows.map((row) => (
          <TaskRow
            key={row.task.id}
            row={row}
            gaps={
              row.opportunityId
                ? props.gapsByOpportunity[row.opportunityId]
                : undefined
            }
            showGaps={showGaps}
          />
        ))}
      </ul>
    </section>
  );
}

export default async function DeadlinesPage() {
  const { rows, gapsByOpportunity } = await loadDeadlinesView();
  const grouped = groupByBucket(rows);

  const overdue = grouped.get("overdue") ?? [];
  const d7 = grouped.get("due_0_7") ?? [];
  const d14 = grouped.get("due_8_14") ?? [];
  const later = grouped.get("later") ?? [];
  const noDue = grouped.get("no_due") ?? [];
  const done = grouped.get("done") ?? [];

  const activeCount = rows.filter((r) => r.bucket !== "done").length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Deadlines
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Tasks tied to opportunities, grouped by urgency. Overdue and two-week
          windows are highlighted. When a submission pack lists missing inputs for
          the same opportunity, they surface here next to near-term work.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          <span className="text-zinc-300">{activeCount}</span> open tasks
          {done.length > 0 ? (
            <>
              {" "}
              · <span className="text-zinc-300">{done.length}</span> completed
            </>
          ) : null}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Add tasks from any opportunity’s Tasks section. Set due dates so they appear in overdue and 7/14-day buckets; missing pack inputs show next to urgent tasks when you’ve documented them on a submission pack."
        >
          <Link
            href="/opportunities"
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Browse opportunities
          </Link>
        </EmptyState>
      ) : (
        <>
      <Section
        title={DEADLINE_BUCKET_LABEL.overdue}
        description="Not done and past the due date."
        bucket="overdue"
        rows={overdue}
        gapsByOpportunity={gapsByOpportunity}
      />
      <Section
        title={DEADLINE_BUCKET_LABEL.due_0_7}
        description="Due today through the next six days."
        bucket="due_0_7"
        rows={d7}
        gapsByOpportunity={gapsByOpportunity}
      />
      <Section
        title={DEADLINE_BUCKET_LABEL.due_8_14}
        description="Second week out — keep visibility before they become urgent."
        bucket="due_8_14"
        rows={d14}
        gapsByOpportunity={gapsByOpportunity}
      />
      <Section
        title={DEADLINE_BUCKET_LABEL.later}
        bucket="later"
        rows={later}
        gapsByOpportunity={gapsByOpportunity}
      />
      <Section
        title="No due date"
        description="Open tasks without a calendar date — set one from the opportunity."
        bucket="no_due"
        rows={noDue}
        gapsByOpportunity={gapsByOpportunity}
      />

      {done.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Completed</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Done tasks stay visible for a quick audit trail.
            </p>
          </div>
          <ul className="space-y-2">
            {done.map((row) => (
              <TaskRow
                key={row.task.id}
                row={row}
                gaps={undefined}
                showGaps={false}
              />
            ))}
          </ul>
        </section>
      ) : null}
        </>
      )}
    </div>
  );
}

import { formatDateOnly } from "@/lib/format";
import {
  RECOMMENDED_ACTION_LABEL,
  deadlineUrgencyLabel,
  recommendationHint,
  type RecommendedAction,
} from "@/lib/opportunities/scoring-engine";

const actionStyles: Record<
  RecommendedAction,
  { border: string; bg: string; accent: string }
> = {
  apply_now: {
    border: "border-emerald-700/60",
    bg: "bg-emerald-950/35",
    accent: "text-emerald-300",
  },
  prepare: {
    border: "border-sky-700/60",
    bg: "bg-sky-950/35",
    accent: "text-sky-300",
  },
  monitor: {
    border: "border-amber-700/50",
    bg: "bg-amber-950/30",
    accent: "text-amber-200",
  },
  ignore: {
    border: "border-zinc-700",
    bg: "bg-zinc-900/50",
    accent: "text-zinc-400",
  },
};

export function ScoreTriageCard(props: {
  overall: number | null;
  compositeFit: number | null;
  timeSensitivity: number | null;
  recommendation: RecommendedAction;
  closesAt: Date | string | null;
}) {
  const st = actionStyles[props.recommendation];
  const overallPct = props.overall ?? 0;
  const fitPct = props.compositeFit != null ? ((props.compositeFit - 1) / 4) * 100 : 0;
  const urgencyPct =
    props.timeSensitivity != null
      ? ((props.timeSensitivity - 1) / 4) * 100
      : 0;

  return (
    <div
      className={`rounded-xl border p-5 ${st.border} ${st.bg}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Triage
          </p>
          <p className={`mt-1 text-lg font-semibold ${st.accent}`}>
            {RECOMMENDED_ACTION_LABEL[props.recommendation]}
          </p>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            {recommendationHint(props.recommendation)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Weighted score</p>
          <p className="text-3xl font-semibold tabular-nums text-zinc-50">
            {props.overall != null ? props.overall : "—"}
            {props.overall != null ? (
              <span className="text-lg font-normal text-zinc-500">/100</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Fit (avg. eligibility / Restormel / SOPHIA)</span>
            <span>
              {props.compositeFit != null
                ? props.compositeFit.toFixed(1)
                : "—"}
              {props.compositeFit != null ? "/5" : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width]"
              style={{ width: `${Math.min(100, Math.max(0, fitPct))}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Urgency (time sensitivity)</span>
            <span>
              {props.timeSensitivity != null
                ? `${props.timeSensitivity}/5`
                : "—"}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-700 to-orange-400 transition-[width]"
              style={{ width: `${Math.min(100, Math.max(0, urgencyPct))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {deadlineUrgencyLabel(props.closesAt)} ·{" "}
            {props.closesAt != null
              ? formatDateOnly(props.closesAt)
              : "no date"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>Overall (filled dimensions only)</span>
          <span>{props.overall != null ? `${overallPct}%` : "Add scores"}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-200"
            style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

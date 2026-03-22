/**
 * Weighted triage scoring (1–5 per dimension). Weights renormalise when some fields are blank.
 * `effortRequired` is inverted: higher = more work → lower contribution to the overall score.
 */

export const SCORE_DIMENSION_KEYS = [
  "eligibilityFit",
  "restormelFit",
  "sophiaFit",
  "cashValue",
  "burnReductionValue",
  "effortRequired",
  "strategicValue",
  "timeSensitivity",
] as const;

export type ScoreDimensionKey = (typeof SCORE_DIMENSION_KEYS)[number];

export const SCORE_WEIGHTS: Record<ScoreDimensionKey, number> = {
  eligibilityFit: 0.16,
  restormelFit: 0.12,
  sophiaFit: 0.12,
  cashValue: 0.1,
  burnReductionValue: 0.1,
  effortRequired: 0.1,
  strategicValue: 0.14,
  timeSensitivity: 0.16,
};

export const SCORE_FIELD_COPY: Record<
  ScoreDimensionKey,
  { label: string; hint: string }
> = {
  eligibilityFit: {
    label: "Eligibility fit",
    hint: "Match to stated eligibility and constraints.",
  },
  restormelFit: {
    label: "Restormel fit",
    hint: "Community / keys / access narrative alignment.",
  },
  sophiaFit: {
    label: "SOPHIA fit",
    hint: "Product evidence and operator-grade story.",
  },
  cashValue: {
    label: "Cash value",
    hint: "Relative value of the award (not exact £).",
  },
  burnReductionValue: {
    label: "Burn reduction",
    hint: "How much it eases runway pressure.",
  },
  effortRequired: {
    label: "Effort required",
    hint: "1 = light lift, 5 = heavy lift (hurts the score).",
  },
  strategicValue: {
    label: "Strategic value",
    hint: "Importance beyond cash (credibility, partnerships).",
  },
  timeSensitivity: {
    label: "Time sensitivity",
    hint: "Deadline pressure and decision timing.",
  },
};

export type ScoringInput = Partial<
  Record<ScoreDimensionKey, number | null | undefined>
>;

export const RECOMMENDED_ACTIONS = [
  "apply_now",
  "prepare",
  "monitor",
  "ignore",
] as const;

export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];

export const RECOMMENDED_ACTION_LABEL: Record<RecommendedAction, string> = {
  apply_now: "Apply now",
  prepare: "Prepare",
  monitor: "Monitor",
  ignore: "Ignore",
};

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n;
}

/** Map 1–5 → 0–1. For effort required: 1 = light, 5 = heavy; heavy reduces the overall score. */
function normalizedContribution(key: ScoreDimensionKey, value: number): number {
  if (key === "effortRequired") {
    const inverted = 6 - value;
    return (inverted - 1) / 4;
  }
  return (value - 1) / 4;
}

/** 0–100 from answered dimensions only; weights renormalised. */
export function weightedOverall(input: ScoringInput): number | null {
  let weighted = 0;
  let wSum = 0;
  for (const key of SCORE_DIMENSION_KEYS) {
    const v = toNum(input[key]);
    if (v == null) continue;
    const w = SCORE_WEIGHTS[key];
    wSum += w;
    weighted += w * normalizedContribution(key, v);
  }
  if (wSum === 0) return null;
  return Math.round((weighted / wSum) * 100);
}

export function averageFit(input: ScoringInput): number | null {
  const vals = [
    toNum(input.eligibilityFit),
    toNum(input.restormelFit),
    toNum(input.sophiaFit),
  ].filter((x): x is number => x != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function recommendFromScores(input: {
  overall: number | null;
  scoring: ScoringInput;
}): RecommendedAction {
  const o = input.overall;
  const elig = toNum(input.scoring.eligibilityFit);
  const ts = toNum(input.scoring.timeSensitivity);
  const fitAvg = averageFit(input.scoring);

  if (o == null) {
    if (fitAvg != null && fitAvg <= 2) return "ignore";
    if (fitAvg != null && fitAvg >= 4) return "monitor";
    return "monitor";
  }

  if (o >= 76 && (ts ?? 0) >= 4 && (elig ?? 0) >= 4) return "apply_now";
  if (o >= 60 && (elig ?? 0) >= 3) return "prepare";
  if (o >= 40) return "monitor";
  return "ignore";
}

export function recommendationHint(action: RecommendedAction): string {
  switch (action) {
    case "apply_now":
      return "Strong fit and urgency — prioritise submission.";
    case "prepare":
      return "Worth building evidence and pack before committing time.";
    case "monitor":
      return "Keep on the radar; revisit when more is known.";
    case "ignore":
      return "Low priority versus other options.";
    default:
      return "";
  }
}

/** Row from DB → scoring input (camelCase keys). */
export function scoreRowToInput(row: {
  eligibilityFit: unknown;
  restormelFit: unknown;
  sophiaFit: unknown;
  cashValue: unknown;
  burnReductionValue: unknown;
  effortRequired: unknown;
  strategicValue: unknown;
  timeSensitivity: unknown;
} | null | undefined): ScoringInput {
  if (!row) return {};
  return {
    eligibilityFit: toNum(row.eligibilityFit),
    restormelFit: toNum(row.restormelFit),
    sophiaFit: toNum(row.sophiaFit),
    cashValue: toNum(row.cashValue),
    burnReductionValue: toNum(row.burnReductionValue),
    effortRequired: toNum(row.effortRequired),
    strategicValue: toNum(row.strategicValue),
    timeSensitivity: toNum(row.timeSensitivity),
  };
}

export function deadlineUrgencyLabel(
  closesAt: Date | string | null | undefined,
): string {
  if (closesAt == null) return "No deadline set";
  const d = typeof closesAt === "string" ? new Date(closesAt) : closesAt;
  if (Number.isNaN(d.getTime())) return "No deadline set";
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  if (days <= 30) return `Due in ${days} days`;
  return `Due in ${days} days`;
}

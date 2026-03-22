import { z } from "zod";

import {
  CONFLICT_SEVERITIES,
  OPPORTUNITY_STATUSES,
  PACK_STATUSES,
  TASK_STATUSES,
} from "./constants";

const uuidOrEmpty = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalDateTime = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v : undefined));

const optionalDecimal = z
  .string()
  .optional()
  .transform((v) => {
    if (v == null || v.trim() === "") return undefined;
    const n = Number.parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? String(n) : undefined;
  });

export const opportunityFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(4000),
  summary: z.string().optional(),
  funderName: z.string().optional(),
  closesAt: optionalDateTime,
  status: z.enum(OPPORTUNITY_STATUSES),
  ownerUserId: uuidOrEmpty,
  eligibilityNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  estimatedValue: optionalDecimal,
  currencyCode: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code")
    .default("GBP"),
});

export type OpportunityFormInput = z.infer<typeof opportunityFormSchema>;

const scoreField = z
  .string()
  .optional()
  .transform((v) => {
    if (v == null || v.trim() === "") return undefined;
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n) || n < 1 || n > 5) return undefined;
    return n;
  });

export const opportunityScoreFormSchema = z.object({
  opportunityId: z.string().uuid(),
  eligibilityFit: scoreField,
  restormelFit: scoreField,
  sophiaFit: scoreField,
  cashValue: scoreField,
  burnReductionValue: scoreField,
  effortRequired: scoreField,
  strategicValue: scoreField,
  timeSensitivity: scoreField,
  rationale: z.string().optional(),
});

export const taskQuickSchema = z.object({
  opportunityId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(2000),
  dueAt: optionalDateTime,
  status: z.enum(TASK_STATUSES),
});

export const packQuickSchema = z.object({
  opportunityId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(512),
  status: z.enum(PACK_STATUSES),
});

export const conflictQuickSchema = z.object({
  opportunityId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(512),
  detail: z.string().optional(),
  severity: z.enum(CONFLICT_SEVERITIES),
});

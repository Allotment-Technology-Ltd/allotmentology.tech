import type { submissionPacks } from "@/db/schema/tables";

/** Row shape for pack editing — use type-only import so client bundles do not pull Drizzle/pg. */
export type SubmissionPackRow = typeof submissionPacks.$inferSelect;

import { pgEnum } from "drizzle-orm/pg-core";

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "draft",
  "shortlisted",
  "in_progress",
  "submitted",
  "declined",
  "archived",
]);

export const collateralKindEnum = pgEnum("collateral_kind", [
  "founder_bio",
  "company_overview",
  "restormel_summary",
  "restormel_keys_summary",
  "sophia_summary",
  "traction_note",
  "budget_assumption",
  "standard_answer",
  "asset_reference",
]);

export const submissionPackStatusEnum = pgEnum("submission_pack_status", [
  "draft",
  "in_review",
  "ready",
  "submitted",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "blocked",
  "done",
]);

export const conflictSeverityEnum = pgEnum("conflict_severity", [
  "low",
  "medium",
  "high",
]);

export const watchlistSourceTypeEnum = pgEnum("watchlist_source_type", [
  "funder_portal",
  "newsletter",
  "rss",
  "manual",
  "other",
]);

export const knowledgeAssetTypeEnum = pgEnum("knowledge_asset_type", [
  "repository",
  "document",
  "file",
  "portal",
  "other",
]);

export const userApprovalStatusEnum = pgEnum("user_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

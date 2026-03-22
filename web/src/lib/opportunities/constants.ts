export const OPPORTUNITY_STATUSES = [
  "draft",
  "shortlisted",
  "in_progress",
  "submitted",
  "declined",
  "archived",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, string> = {
  draft: "Draft",
  shortlisted: "Shortlisted",
  in_progress: "In progress",
  submitted: "Submitted",
  declined: "Declined",
  archived: "Archived",
};

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const PACK_STATUSES = [
  "draft",
  "in_review",
  "ready",
  "submitted",
] as const;

export type PackStatus = (typeof PACK_STATUSES)[number];

export const PACK_STATUS_LABEL: Record<PackStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  ready: "Ready",
  submitted: "Submitted",
};

export const CONFLICT_SEVERITIES = ["low", "medium", "high"] as const;

export type ConflictSeverity = (typeof CONFLICT_SEVERITIES)[number];

export const CONFLICT_SEVERITY_LABEL: Record<ConflictSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

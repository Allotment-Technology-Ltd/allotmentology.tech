ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "working_thesis" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "project_framing" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "summary_100" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "summary_250" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "draft_answers_md" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "missing_inputs_md" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "risks_md" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission_packs" ADD COLUMN IF NOT EXISTS "checklist_md" text DEFAULT '' NOT NULL;

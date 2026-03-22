ALTER TABLE "opportunity_scores" DROP COLUMN IF EXISTS "fit_score";--> statement-breakpoint
ALTER TABLE "opportunity_scores" DROP COLUMN IF EXISTS "readiness_score";--> statement-breakpoint
ALTER TABLE "opportunity_scores" DROP COLUMN IF EXISTS "effort_score";--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "eligibility_fit" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "restormel_fit" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "sophia_fit" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "cash_value" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "burn_reduction_value" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "effort_required" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "strategic_value" smallint;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD COLUMN "time_sensitivity" smallint;
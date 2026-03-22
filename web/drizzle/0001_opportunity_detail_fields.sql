ALTER TABLE "opportunities" ADD COLUMN "eligibility_notes" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "estimated_value" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "currency_code" varchar(3) DEFAULT 'GBP' NOT NULL;
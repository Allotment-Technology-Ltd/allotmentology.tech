CREATE TYPE "public"."user_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approval_status" "user_approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "users"
SET "approval_status" = 'approved',
    "approved_at" = COALESCE("approved_at", now())
WHERE "approval_status" = 'pending';

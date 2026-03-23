CREATE TYPE "public"."knowledge_asset_type" AS ENUM('repository', 'document', 'file', 'portal', 'other');--> statement-breakpoint
CREATE TABLE "knowledge_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(512) NOT NULL,
	"source_type" "knowledge_asset_type" DEFAULT 'document' NOT NULL,
	"url" text NOT NULL,
	"summary" text,
	"tags" text[],
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_knowledge_assets" (
	"opportunity_id" uuid NOT NULL,
	"knowledge_asset_id" uuid NOT NULL,
	"relevance_note" text,
	"priority" smallint DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunity_knowledge_assets_opportunity_id_knowledge_asset_id_pk" PRIMARY KEY("opportunity_id","knowledge_asset_id")
);
--> statement-breakpoint
CREATE TABLE "writing_style_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"profile_name" varchar(255) DEFAULT 'Default' NOT NULL,
	"voice_description" text DEFAULT '' NOT NULL,
	"style_guardrails_md" text DEFAULT '' NOT NULL,
	"banned_phrases" text[],
	"preferred_structure" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "writing_style_profiles_owner_user_id_unique" UNIQUE("owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "writing_style_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"source_url" text,
	"sample_text" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_knowledge_assets" ADD CONSTRAINT "opportunity_knowledge_assets_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_knowledge_assets" ADD CONSTRAINT "opportunity_knowledge_assets_knowledge_asset_id_knowledge_assets_id_fk" FOREIGN KEY ("knowledge_asset_id") REFERENCES "public"."knowledge_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_style_profiles" ADD CONSTRAINT "writing_style_profiles_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_style_samples" ADD CONSTRAINT "writing_style_samples_profile_id_writing_style_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."writing_style_profiles"("id") ON DELETE cascade ON UPDATE no action;
DROP TABLE IF EXISTS "user_ai_credentials";

CREATE TABLE "user_ai_provider_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"label" varchar(255),
	"provider_name" varchar(255) DEFAULT 'Custom' NOT NULL,
	"base_url" text NOT NULL,
	"model" varchar(512) NOT NULL,
	"api_key_stored" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamptz,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "user_ai_provider_keys_user_active_idx" ON "user_ai_provider_keys" ("user_id") WHERE "revoked_at" IS NULL;

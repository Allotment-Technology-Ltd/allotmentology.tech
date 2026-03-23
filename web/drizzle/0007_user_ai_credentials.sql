CREATE TABLE "user_ai_credentials" (
	"user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"provider_preset" varchar(32) NOT NULL,
	"custom_base_url" text,
	"model" varchar(256) NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

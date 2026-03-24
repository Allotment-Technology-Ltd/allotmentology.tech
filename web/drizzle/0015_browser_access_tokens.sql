CREATE TABLE IF NOT EXISTS "browser_access_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "token_prefix" varchar(16) NOT NULL,
  "label" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_used_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "browser_access_tokens_token_hash_idx" ON "browser_access_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "browser_access_tokens_user_id_idx" ON "browser_access_tokens" ("user_id");

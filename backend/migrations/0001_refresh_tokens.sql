CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "token" text PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");

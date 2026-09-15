CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY, "name" text NOT NULL, "email" text NOT NULL UNIQUE, "email_verified" boolean NOT NULL DEFAULT false, "image" text, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "role" text NOT NULL DEFAULT 'user');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" ("id" text PRIMARY KEY, "expires_at" timestamptz NOT NULL, "token" text NOT NULL UNIQUE, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "ip_address" text, "user_agent" text, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" ("id" text PRIMARY KEY, "account_id" text NOT NULL, "provider_id" text NOT NULL, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "access_token" text, "refresh_token" text, "id_token" text, "access_token_expires_at" timestamptz, "refresh_token_expires_at" timestamptz, "scope" text, "password" text, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" ("id" text PRIMARY KEY, "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" timestamptz NOT NULL, "created_at" timestamptz, "updated_at" timestamptz);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chats" ("id" text PRIMARY KEY, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "title" text NOT NULL, "createdAt" text NOT NULL, "sources" jsonb NOT NULL DEFAULT '[]'::jsonb, "files" jsonb NOT NULL DEFAULT '[]'::jsonb);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" ("id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, "messageId" text NOT NULL, "chatId" text NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE, "backendId" text NOT NULL, "query" text NOT NULL, "createdAt" text NOT NULL, "responseBlocks" jsonb NOT NULL DEFAULT '[]'::jsonb, "status" text NOT NULL DEFAULT 'answering');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_user_id_idx" ON "chats" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_chat_id_idx" ON "messages" ("chatId");

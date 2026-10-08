CREATE TYPE "public"."version_source" AS ENUM('manual', 'ai', 'autosave');
CREATE TYPE "public"."file_status" AS ENUM('uploading', 'ready', 'failed');
CREATE TYPE "public"."ai_run_status" AS ENUM('running', 'completed', 'failed', 'cancelled');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "title" text NOT NULL,
  "ydoc_state" bytea,
  "content_json" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "document_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE cascade,
  "content_json" jsonb NOT NULL,
  "ydoc_state" bytea,
  "label" text,
  "source" "version_source" NOT NULL,
  "ai_run_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "document_id" uuid REFERENCES "documents"("id") ON DELETE set null,
  "filename" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "storage_path" text NOT NULL,
  "extracted_text" text,
  "status" "file_status" DEFAULT 'uploading' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "prompt" text NOT NULL,
  "model" text NOT NULL,
  "status" "ai_run_status" DEFAULT 'running' NOT NULL,
  "ops" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "error" text,
  "input_tokens" integer,
  "output_tokens" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE INDEX "documents_user_updated_idx" ON "documents" ("user_id", "updated_at" DESC);
CREATE INDEX "files_document_idx" ON "files" ("document_id");
CREATE INDEX "ai_runs_document_idx" ON "ai_runs" ("document_id", "created_at" DESC);

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_runs" ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."ai_run_review_status" AS ENUM('pending', 'accepted', 'partial', 'rejected');
CREATE TYPE "public"."citation_style" AS ENUM('apa7', 'harvard', 'aglc4', 'ieee', 'vancouver');

ALTER TABLE "ai_runs"
  ADD COLUMN "response_text" text,
  ADD COLUMN "changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "review_status" "ai_run_review_status";

ALTER TABLE "documents"
  ADD COLUMN "citation_style" "citation_style" DEFAULT 'apa7' NOT NULL;

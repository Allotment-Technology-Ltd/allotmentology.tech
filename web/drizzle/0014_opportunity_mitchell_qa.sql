ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "mitchell_qa_question_md" text;
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "mitchell_qa_notes_md" text;
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "mitchell_qa_response_md" text;

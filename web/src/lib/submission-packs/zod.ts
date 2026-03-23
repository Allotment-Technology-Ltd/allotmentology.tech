import { z } from "zod";

import { PACK_STATUSES } from "@/lib/opportunities/constants";

export const submissionPackFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(512),
  status: z.enum(PACK_STATUSES),
  workingThesis: z.string(),
  projectFraming: z.string(),
  summary100: z.string(),
  summary250: z.string(),
  applicationFormsMd: z.string(),
  draftAnswersMd: z.string(),
  missingInputsMd: z.string(),
  risksMd: z.string(),
  checklistMd: z.string(),
});

export type SubmissionPackFormInput = z.infer<typeof submissionPackFormSchema>;

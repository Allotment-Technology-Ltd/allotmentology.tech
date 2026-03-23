import { z } from "zod";

/** Types of evidence Mitchell may ask the user to link or paste. */
export const mitchellMaterialKindSchema = z.enum([
  "linkedin_profile",
  "cv_or_resume",
  "portfolio",
  "previous_application",
  "reference_or_testimonial",
  "financial_or_accounts",
  "other",
]);

export type MitchellMaterialKind = z.infer<typeof mitchellMaterialKindSchema>;

export const mitchellMaterialRequestSchema = z.object({
  kind: mitchellMaterialKindSchema,
  /** Why it matters and what to add (Mitchell voice, short). */
  message: z.string(),
});

export type MitchellMaterialRequest = z.infer<typeof mitchellMaterialRequestSchema>;

export function formatMitchellMaterialKindLabel(
  kind: MitchellMaterialKind,
): string {
  switch (kind) {
    case "linkedin_profile":
      return "LinkedIn / profile";
    case "cv_or_resume":
      return "CV or résumé";
    case "portfolio":
      return "Portfolio / samples";
    case "previous_application":
      return "Previous application or pitch";
    case "reference_or_testimonial":
      return "Reference or testimonial";
    case "financial_or_accounts":
      return "Financial / accounts";
    default:
      return "Other";
  }
}

export function formatMaterialRequestsMarkdown(
  requests: MitchellMaterialRequest[],
): string {
  if (requests.length === 0) return "";
  return requests
    .map(
      (m) =>
        `- **${formatMitchellMaterialKindLabel(m.kind)}:** ${m.message}`,
    )
    .join("\n");
}

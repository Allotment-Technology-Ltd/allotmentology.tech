import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const submissionOperatorOutputSchema = z.object({
  checklistSuggestions: z.array(z.string()),
  portalPasteOrder: z.array(z.string()),
  manualSteps: z.array(z.string()),
  riskReminders: z.array(z.string()),
});

export type SubmissionOperatorOutput = z.infer<
  typeof submissionOperatorOutputSchema
>;

export async function runSubmissionOperator(
  ctx: FundingOpsAiContext,
  input: {
    packSummary: string;
    deadlineIso?: string | null;
    portalNotes?: string;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "subagent",
    moduleName: "submission-operator",
    moduleDirective: `You help a human submit an application safely.
Produce ordered operational steps and checklist items. Never instruct auto-submit or bypassing review.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: submissionOperatorOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

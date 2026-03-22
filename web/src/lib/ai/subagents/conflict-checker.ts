import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const conflictCheckerOutputSchema = z.object({
  hasConflict: z.boolean(),
  conflicts: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  resolutionSuggestions: z.array(z.string()),
});

export type ConflictCheckerOutput = z.infer<typeof conflictCheckerOutputSchema>;

export async function runConflictChecker(
  ctx: FundingOpsAiContext,
  input: {
    narrativeA: string;
    narrativeB: string;
    contextLabel?: string;
  },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "subagent",
    moduleName: "conflict-checker",
    moduleDirective: `You compare two narratives (e.g. different funders or drafts) and detect scope, promise, or fact conflicts.
Be conservative: if unsure, lower severity and explain in resolutionSuggestions.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: conflictCheckerOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(value, { model: ctx.model, logId });
}

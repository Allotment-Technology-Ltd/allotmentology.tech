import { z } from "zod";

import { runJsonModule } from "@/lib/ai/structured";
import type { FundingOpsAiContext } from "@/lib/ai/runtime";
import { asGenerated } from "@/lib/ai/types";

export const compressToLimitOutputSchema = z.object({
  compressed: z.string(),
  withinLimit: z.boolean(),
  droppedThemes: z.array(z.string()),
});

export type CompressToLimitOutput = z.infer<typeof compressToLimitOutputSchema> & {
  maxChars: number;
};

export async function compressToLimit(
  ctx: FundingOpsAiContext,
  input: { text: string; maxChars: number; preserveMustInclude?: string[] },
) {
  const { value, logId } = await runJsonModule(ctx, {
    moduleKind: "skill",
    moduleName: "compress-to-limit",
    moduleDirective: `Compress text to at most maxChars characters (hard limit). Preserve meaning; list droppedThemes honestly.
Set withinLimit true only if compressed length <= maxChars. The user message includes maxChars — obey it exactly.`,
    userPayload: JSON.stringify(input, null, 2),
    schema: compressToLimitOutputSchema,
    inputSnapshot: { ...input },
  });
  return asGenerated(
    { ...value, maxChars: input.maxChars },
    { model: ctx.model, logId },
  );
}

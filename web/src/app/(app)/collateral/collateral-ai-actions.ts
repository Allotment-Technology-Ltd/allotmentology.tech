"use server";

import { z } from "zod";

import {
  FUNDING_OPS_CONSTITUTION,
  MITCHELL_VOICE_OVERLAY,
  NON_GENERIC_WRITING_GUARDRAILS,
} from "@/lib/ai/constitution";
import { AiNotConfiguredError, AiProviderError } from "@/lib/ai/errors";
import { logAiProviderErrorForRoute } from "@/lib/ai/log-provider-failure";
import { augmentProviderErrorMessage } from "@/lib/ai/provider-error-hints";
import { insertAiGenerationLog } from "@/lib/ai/logging";
import { chatMessages } from "@/lib/ai/provider/openai-compatible";
import { tryCreateFundingOpsAiContext } from "@/lib/ai/runtime";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { COLLATERAL_KIND_LABEL, COLLATERAL_KINDS } from "@/lib/collateral/constants";

export type CollateralAiFormState = {
  error: string | null;
  markdown?: string;
  model?: string;
  logId?: string;
};

const modeSchema = z.enum(["improve", "expand", "shorten"]);

const aiInputSchema = z.object({
  title: z.string().trim().min(1).max(512),
  kind: z.enum(COLLATERAL_KINDS),
  tags: z.string().max(2000),
  body: z.string().max(500_000),
  mode: modeSchema,
});

function modeDirective(mode: z.infer<typeof modeSchema>): string {
  const byMode: Record<z.infer<typeof modeSchema>, string> = {
    improve: `Improve the draft: clearer structure, stronger plain-English sentences, consistent Markdown headings/lists where helpful. Do not add new factual claims.`,
    expand: `Expand the draft with useful detail and sub-points where the text is thin. If evidence is missing, add short "Verify:" bullets instead of inventing facts.`,
    shorten: `Shorten the draft materially while preserving meaning and any explicit numbers/names already present. Prefer tighter paragraphs and fewer words.`,
  };
  return byMode[mode];
}

function handleAiError(e: unknown): CollateralAiFormState {
  if (e instanceof AiNotConfiguredError) {
    return { error: e.message };
  }
  if (e instanceof AiProviderError) {
    logAiProviderErrorForRoute("collateral.runCollateralWritingAid", e);
    return {
      error: augmentProviderErrorMessage(e.message, e.status),
    };
  }
  const msg = e instanceof Error ? e.message : "AI request failed.";
  return { error: msg };
}

export async function runCollateralWritingAid(
  _prev: CollateralAiFormState,
  formData: FormData,
): Promise<CollateralAiFormState> {
  try {
    const { email } = await getSessionUserEmailOrRedirect();
    const appUserId = await getAppUserIdByEmail(email);
    if (!appUserId) {
      return { error: "Local user profile missing; reload and try again." };
    }

    const parsed = aiInputSchema.safeParse({
      title: String(formData.get("title") ?? ""),
      kind: String(formData.get("kind") ?? "standard_answer"),
      tags: String(formData.get("tags") ?? ""),
      body: String(formData.get("body") ?? ""),
      mode: String(formData.get("mode") ?? "improve"),
    });
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid input for AI draft.",
      };
    }

    const { title, kind, tags, body, mode } = parsed.data;
    const kindLabel = COLLATERAL_KIND_LABEL[kind];

    const ctx = await tryCreateFundingOpsAiContext({ userId: appUserId });
    if (!ctx) {
      return {
        error:
          "AI is not configured. Add API keys under Settings or BYOK & AI keys.",
      };
    }

    const system = `${FUNDING_OPS_CONSTITUTION}

${NON_GENERIC_WRITING_GUARDRAILS}

${MITCHELL_VOICE_OVERLAY}

You are revising collateral stored in a funding-ops library (Markdown body).

Output rules:
- Return GitHub-flavored Markdown ONLY for the revised body. No JSON. No code fences around the whole document unless the user content already used fenced code.
- Do not wrap the output in a preamble like "Here is..." — start directly with the Markdown content.
- Never invent customer names, pilots, metrics, or grant outcomes not present in the draft or tags.

${modeDirective(mode)}`;

    const userMsg = `Collateral type: ${kindLabel}
Title: ${title}
Tags: ${tags.trim() || "(none)"}

Current draft:
---
${body}
---

Produce the full revised Markdown body.`;

    const messages = chatMessages(system, userMsg);
    const result = await ctx.provider.complete({
      messages,
      model: ctx.model,
      temperature: mode === "shorten" ? 0.1 : 0.2,
      maxTokens: 8192,
    });

    const markdown = result.text.trim();
    const logId = await insertAiGenerationLog({
      userId: appUserId,
      opportunityId: null,
      moduleKind: "skill",
      moduleName: "collateral-writing-aid",
      providerModel: ctx.model,
      inputJson: {
        title,
        kind,
        mode,
        bodyChars: body.length,
      },
      outputJson: { markdownChars: markdown.length },
      usage: result.usage,
    });

    return {
      error: null,
      markdown,
      model: ctx.model,
      logId,
    };
  } catch (e) {
    return handleAiError(e);
  }
}

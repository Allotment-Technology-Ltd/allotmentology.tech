import "server-only";

import { AiNotConfiguredError } from "@/lib/ai/errors";

import type { AiProvider } from "@/lib/ai/provider/types";
import {
  resolveAiModelForUser,
  resolveAiProviderForUser,
} from "@/lib/ai/provider/resolve-user";

export type FundingOpsAiContext = {
  provider: AiProvider;
  model: string;
  userId?: string | null;
  opportunityId?: string | null;
};

export async function createFundingOpsAiContext(
  opts?: Partial<{
    userId: string | null;
    opportunityId: string | null;
    model: string;
    provider: AiProvider;
  }>,
): Promise<FundingOpsAiContext> {
  const ctx = await tryCreateFundingOpsAiContext(opts);
  if (!ctx) throw new AiNotConfiguredError();
  return ctx;
}

/**
 * Same as {@link createFundingOpsAiContext} but returns null when AI is not configured.
 * Resolves per-user BYOK from the database when `userId` is set, otherwise environment defaults.
 */
export async function tryCreateFundingOpsAiContext(
  opts?: Partial<{
    userId: string | null;
    opportunityId: string | null;
    model: string;
    provider: AiProvider;
  }>,
): Promise<FundingOpsAiContext | null> {
  const provider =
    opts?.provider ??
    (await resolveAiProviderForUser(opts?.userId ?? null));
  if (!provider) return null;
  const model =
    opts?.model ?? (await resolveAiModelForUser(opts?.userId ?? null));
  return {
    provider,
    model,
    userId: opts?.userId,
    opportunityId: opts?.opportunityId,
  };
}

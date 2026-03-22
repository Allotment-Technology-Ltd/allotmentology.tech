import "server-only";

import type { AiProvider } from "@/lib/ai/provider/types";
import {
  getDefaultAiModel,
  getDefaultAiProvider,
  requireDefaultAiProvider,
} from "@/lib/ai/provider/index";

export type FundingOpsAiContext = {
  provider: AiProvider;
  model: string;
  userId?: string | null;
  opportunityId?: string | null;
};

export function createFundingOpsAiContext(
  opts?: Partial<{
    userId: string | null;
    opportunityId: string | null;
    model: string;
    provider: AiProvider;
  }>,
): FundingOpsAiContext {
  const provider = opts?.provider ?? requireDefaultAiProvider();
  return {
    provider,
    model: opts?.model ?? getDefaultAiModel(),
    userId: opts?.userId,
    opportunityId: opts?.opportunityId,
  };
}

/**
 * Same as {@link createFundingOpsAiContext} but returns null when AI is not configured.
 */
export function tryCreateFundingOpsAiContext(
  opts?: Partial<{
    userId: string | null;
    opportunityId: string | null;
    model: string;
    provider: AiProvider;
  }>,
): FundingOpsAiContext | null {
  const provider = opts?.provider ?? getDefaultAiProvider();
  if (!provider) return null;
  return {
    provider,
    model: opts?.model ?? getDefaultAiModel(),
    userId: opts?.userId,
    opportunityId: opts?.opportunityId,
  };
}

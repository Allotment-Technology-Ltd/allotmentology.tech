import "server-only";

import { AiProviderError } from "@/lib/ai/errors";

/**
 * Structured server logs for AI HTTP failures (Vercel / Node). No secrets or key material.
 */
export function logAiProviderHttpFailure(opts: {
  providerId: string;
  status: number;
  modelId: string;
  /** API host only (e.g. api.openai.com), when known */
  endpointHost?: string;
}): void {
  console.error(
    "[allotment-ai]",
    JSON.stringify({
      event: "provider_http_error",
      providerId: opts.providerId,
      status: opts.status,
      modelId: opts.modelId,
      endpointHost: opts.endpointHost ?? null,
    }),
  );
}

/**
 * Log when a server action / route surfaces an AI provider error (adds app route for ops).
 */
export function logAiProviderErrorForRoute(route: string, err: InstanceType<typeof AiProviderError>): void {
  console.error(
    "[allotment-ai]",
    JSON.stringify({
      event: "provider_error_action",
      route,
      providerId: err.providerId ?? null,
      modelId: err.modelId ?? null,
      status: err.status ?? null,
    }),
  );
}

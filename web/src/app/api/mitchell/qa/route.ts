import { z } from "zod";

import { executeMitchellQaForOpportunityUser } from "@/app/(app)/opportunities/opportunity-ai-actions";
import {
  findBrowserAccessTokenBySecret,
  touchBrowserAccessToken,
} from "@/lib/auth/browser-access-token.server";
import { AiProviderError } from "@/lib/ai/errors";
import { logAiProviderErrorForRoute } from "@/lib/ai/log-provider-failure";

export const runtime = "nodejs";

const bodySchema = z.object({
  opportunityId: z.string().uuid(),
  question: z.string().trim().min(1).max(20000),
  notes: z.string().trim().max(20000).optional().default(""),
});

/**
 * Mitchell Q&A for the browser extension: Bearer token from Settings → Browser extension.
 * Persists the same `mitchell_qa_*` columns as the in-app flow.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  if (!bearer) {
    return Response.json(
      { ok: false, error: "Missing Authorization: Bearer token." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const resolved = await findBrowserAccessTokenBySecret(bearer);
  if (!resolved) {
    return Response.json(
      { ok: false, error: "Invalid or revoked token." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "Expected JSON body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await executeMitchellQaForOpportunityUser(
      resolved.userId,
      parsed.data.opportunityId,
      {
        question: parsed.data.question,
        notes: parsed.data.notes,
      },
    );

    if (result.ok) {
      await touchBrowserAccessToken(resolved.tokenId);
    }

    return Response.json(result, {
      status: result.ok ? 200 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/mitchell/qa]", e);
    if (e instanceof AiProviderError) {
      logAiProviderErrorForRoute("api.mitchell.qa", e);
    }
    return Response.json(
      { ok: false, error: "Request failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

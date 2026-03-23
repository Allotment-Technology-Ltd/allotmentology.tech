import { sql } from "drizzle-orm";

import { getServerDb } from "@/lib/db/server";

/**
 * Lightweight readiness probe (uptime monitors, post-deploy smoke).
 * Does not require auth. No sensitive data in the response.
 */
export async function GET() {
  try {
    const db = getServerDb();
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[health]", e);
    return Response.json(
      { ok: false, error: "database_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

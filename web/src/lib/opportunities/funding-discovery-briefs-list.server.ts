import "server-only";

import { desc, eq } from "drizzle-orm";

import { fundingDiscoveryBriefs } from "@/db/schema/tables";
import {
  getAppUserIdByEmail,
  getSessionUserEmailOrRedirect,
} from "@/lib/auth/session-user.server";
import { getServerDb } from "@/lib/db/server";

export type SavedFundingBriefListItem = {
  id: string;
  label: string;
  briefText: string;
  lastRunAt: string | null;
  updatedAt: string;
};

export type FundingDiscoveryBriefsLoadResult = {
  briefs: SavedFundingBriefListItem[];
  loadError: string | null;
};

/**
 * RSC data loader (not a Server Action). Keeps discover page from importing "use server" modules for reads.
 */
export async function loadFundingDiscoveryBriefs(): Promise<FundingDiscoveryBriefsLoadResult> {
  const { email } = await getSessionUserEmailOrRedirect();
  const userId = await getAppUserIdByEmail(email);
  if (!userId) {
    return { briefs: [], loadError: null };
  }

  try {
    const db = getServerDb();
    const rows = await db
      .select({
        id: fundingDiscoveryBriefs.id,
        label: fundingDiscoveryBriefs.label,
        briefText: fundingDiscoveryBriefs.briefText,
        lastRunAt: fundingDiscoveryBriefs.lastRunAt,
        updatedAt: fundingDiscoveryBriefs.updatedAt,
      })
      .from(fundingDiscoveryBriefs)
      .where(eq(fundingDiscoveryBriefs.userId, userId))
      .orderBy(desc(fundingDiscoveryBriefs.updatedAt));

    const briefs = rows.map((r) => ({
      id: r.id,
      label: r.label,
      briefText: r.briefText,
      lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
      updatedAt: r.updatedAt.toISOString(),
    }));
    return { briefs, loadError: null };
  } catch (e) {
    console.error("[loadFundingDiscoveryBriefs]", e);
    return {
      briefs: [],
      loadError:
        "Saved briefs could not be loaded. If this persists, run database migrations (see DEPLOYMENT.md) so the funding_discovery_briefs table exists.",
    };
  }
}

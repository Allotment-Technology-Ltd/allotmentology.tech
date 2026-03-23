import "server-only";

import { z } from "zod";

/** Default public catalog (override with RESTORMEL_KEYS_CATALOG_URL). */
export const DEFAULT_RESTORMEL_KEYS_CATALOG_URL =
  "https://restormel.dev/keys/dashboard/api/catalog";

const catalogVariantSchema = z.object({
  id: z.string(),
  providerType: z.string(),
  providerModelId: z.string(),
  availabilityStatus: z.string().optional(),
});

const catalogModelEntrySchema = z.object({
  id: z.string(),
  canonicalName: z.string(),
  family: z.string().optional(),
  lifecycleState: z.string().optional(),
  providerTypes: z.array(z.string()),
  variants: z.array(catalogVariantSchema),
});

const catalogProviderSummarySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  modelCount: z.number().optional(),
  validation: z
    .object({
      mode: z.string(),
      requiresBaseUrl: z.boolean().optional(),
      requiresModel: z.boolean().optional(),
    })
    .optional(),
});

export const restormelKeysCatalogSchema = z.object({
  contractVersion: z.string(),
  source: z.string().optional(),
  generatedAt: z.string().optional(),
  providers: z.array(catalogProviderSummarySchema),
  data: z.array(catalogModelEntrySchema),
});

export type RestormelKeysCatalog = z.infer<typeof restormelKeysCatalogSchema>;

/** Serializable to the BYOK client. */
export type ByokCatalogClientPayload = {
  contractVersion: string;
  generatedAt?: string;
  providers: { id: string; displayName: string }[];
  models: {
    catalogProviderId: string;
    providerModelId: string;
    label: string;
    catalogModelKey: string;
  }[];
};

export type CatalogFetchResult =
  | { ok: true; catalog: RestormelKeysCatalog; clientPayload: ByokCatalogClientPayload }
  | { ok: false; message: string };

function buildClientPayload(catalog: RestormelKeysCatalog): ByokCatalogClientPayload {
  const providers = catalog.providers.map((p) => ({
    id: p.id,
    displayName: p.displayName,
  }));

  const models: ByokCatalogClientPayload["models"] = [];
  for (const m of catalog.data) {
    for (const v of m.variants) {
      if (v.availabilityStatus && v.availabilityStatus !== "available") {
        continue;
      }
      models.push({
        catalogProviderId: v.providerType,
        providerModelId: v.providerModelId,
        label: m.canonicalName,
        catalogModelKey: `${m.id}::${v.id}`,
      });
    }
  }

  return {
    contractVersion: catalog.contractVersion,
    generatedAt: catalog.generatedAt,
    providers,
    models,
  };
}

/**
 * When `@restormel/keys` ships catalog helpers (patch release), prefer them so routing matches
 * the dashboard contract. Falls back to direct fetch when helpers are absent or fail.
 */
async function tryFetchCatalogViaSdk(
  catalogUrl: string,
): Promise<unknown | null> {
  try {
    const mod = (await import("@restormel/keys")) as Record<string, unknown>;
    const withFallback = mod.fetchCanonicalCatalogWithFallback;
    const plain = mod.fetchCanonicalCatalog;
    if (typeof withFallback === "function") {
      const out = await (
        withFallback as (opts?: {
          catalogUrl?: string;
          fallbackCatalogUrl?: string;
        }) => Promise<unknown>
      )({
        catalogUrl,
        fallbackCatalogUrl: DEFAULT_RESTORMEL_KEYS_CATALOG_URL,
      });
      return out ?? null;
    }
    if (typeof plain === "function") {
      const out = await (
        plain as (opts?: { catalogUrl?: string }) => Promise<unknown>
      )({ catalogUrl });
      return out ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function parseCatalogJson(json: unknown): CatalogFetchResult {
  const parsed = restormelKeysCatalogSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Catalog response did not match expected shape.",
    };
  }

  if (parsed.data.providers.length === 0) {
    return { ok: false, message: "Catalog returned no providers." };
  }

  const clientPayload = buildClientPayload(parsed.data);
  if (clientPayload.models.length === 0) {
    return { ok: false, message: "Catalog returned no models." };
  }

  return {
    ok: true,
    catalog: parsed.data,
    clientPayload,
  };
}

/**
 * Fetch Restormel Keys canonical provider/model catalog.
 */
export async function fetchRestormelKeysCatalog(): Promise<CatalogFetchResult> {
  const url =
    process.env.RESTORMEL_KEYS_CATALOG_URL?.trim() || DEFAULT_RESTORMEL_KEYS_CATALOG_URL;

  const sdkJson = await tryFetchCatalogViaSdk(url);
  if (sdkJson != null) {
    const parsed = parseCatalogJson(sdkJson);
    if (parsed.ok) {
      return parsed;
    }
    /* SDK returned data we could not parse — fall through to HTTP fetch. */
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: ac.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AllotmentFundingOps/1.0 (BYOK catalog)",
      },
      next: { revalidate: 300 },
    });
    clearTimeout(t);

    if (!res.ok) {
      return {
        ok: false,
        message: `Catalog HTTP ${res.status} (${url})`,
      };
    }

    const json: unknown = await res.json().catch(() => null);
    const parsed = parseCatalogJson(json);
    if (!parsed.ok) {
      return parsed;
    }
    return parsed;
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : "Catalog request failed.";
    return { ok: false, message: msg };
  }
}

import "server-only";

import { fetchCanonicalCatalogWithFallback } from "@restormel/keys/dashboard";
import { z } from "zod";

import { CATALOG_PROVIDER_MODEL_DENYLIST } from "@/lib/restormel-keys/catalog-denylist";
import { buildLocalFallbackCatalog } from "@/lib/restormel-keys/catalog-fallback";

/** Default public catalog host (override with RESTORMEL_KEYS_BASE or RESTORMEL_KEYS_CATALOG_URL). */
export const DEFAULT_RESTORMEL_KEYS_CATALOG_URL =
  "https://restormel.dev/keys/dashboard/api/catalog";

const catalogVariantSchema = z.object({
  id: z.string(),
  providerType: z.string(),
  providerModelId: z.string(),
  availabilityStatus: z.string().nullable().optional(),
});

const catalogModelEntrySchema = z.object({
  id: z.string(),
  canonicalName: z.string(),
  family: z.string().nullable().optional(),
  lifecycleState: z.string().nullable().optional(),
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
  paging: z
    .object({
      limit: z.number(),
      offset: z.number(),
      count: z.number(),
    })
    .optional(),
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
  | {
      ok: true;
      catalog: RestormelKeysCatalog;
      clientPayload: ByokCatalogClientPayload;
      catalogSource: "restormel" | "fallback";
      degradedReason?: string;
    }
  | { ok: false; message: string };

const BAD_MODEL_LIFECYCLES = new Set([
  "deprecated",
  "retired",
  "sunset",
  "end_of_life",
  "eol",
]);

function isModelLifecycleSelectable(lifecycle: string | null | undefined): boolean {
  if (lifecycle == null || lifecycle === "") return true;
  const s = lifecycle.trim().toLowerCase();
  return !BAD_MODEL_LIFECYCLES.has(s);
}

/**
 * Prefer explicit `availabilityStatus === "available"`. If the field is absent (legacy
 * feeds), allow the variant and rely on lifecycle + denylist gating.
 */
function isVariantSelectable(
  providerModelId: string,
  availabilityStatus: string | null | undefined,
): boolean {
  if (CATALOG_PROVIDER_MODEL_DENYLIST.has(providerModelId.trim())) return false;
  const st = availabilityStatus?.trim() ?? "";
  if (st !== "" && st !== "available") return false;
  return true;
}

/**
 * Apply viability gating: GA lifecycle, variant availability === available, denylist.
 */
export function filterCatalogForByokUi(
  catalog: RestormelKeysCatalog,
): RestormelKeysCatalog {
  const data = catalog.data
    .filter((m) => isModelLifecycleSelectable(m.lifecycleState))
    .map((m) => ({
      ...m,
      variants: m.variants.filter((v) =>
        isVariantSelectable(v.providerModelId, v.availabilityStatus ?? null),
      ),
    }))
    .filter((m) => m.variants.length > 0);

  return { ...catalog, data };
}

function buildClientPayload(catalog: RestormelKeysCatalog): ByokCatalogClientPayload {
  const gated = filterCatalogForByokUi(catalog);
  const providers = gated.providers.map((p) => ({
    id: p.id,
    displayName: p.displayName,
  }));

  const models: ByokCatalogClientPayload["models"] = [];
  for (const m of gated.data) {
    for (const v of m.variants) {
      models.push({
        catalogProviderId: v.providerType,
        providerModelId: v.providerModelId,
        label: m.canonicalName,
        catalogModelKey: `${m.id}::${v.id}`,
      });
    }
  }

  return {
    contractVersion: gated.contractVersion,
    generatedAt: gated.generatedAt,
    providers,
    models,
  };
}

function getDashboardBaseUrl(): string {
  const full = process.env.RESTORMEL_KEYS_CATALOG_URL?.trim();
  if (full) {
    try {
      const u = new URL(full);
      if (u.pathname.includes("/keys/dashboard/api/catalog")) {
        return u.origin;
      }
      return u.origin;
    } catch {
      /* fall through */
    }
  }
  const b = process.env.RESTORMEL_KEYS_BASE?.trim();
  if (b) return b.replace(/\/+$/, "");
  return "https://restormel.dev";
}

type ParsedCatalogOk = {
  ok: true;
  catalog: RestormelKeysCatalog;
  clientPayload: ByokCatalogClientPayload;
};

function parseCatalogJson(json: unknown): ParsedCatalogOk | { ok: false; message: string } {
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
    return {
      ok: false,
      message: "No viable models after lifecycle and availability filtering.",
    };
  }

  return {
    ok: true,
    catalog: parsed.data,
    clientPayload,
  };
}

/**
 * Fetch Restormel Keys canonical provider/model catalog via @restormel/keys, with
 * local fallback when the feed is down. Never call the catalog from the browser.
 */
export async function fetchRestormelKeysCatalog(): Promise<CatalogFetchResult> {
  const baseUrl = getDashboardBaseUrl();

  try {
    const { catalog, source, degradedReason } =
      await fetchCanonicalCatalogWithFallback({
        baseUrl,
        fallback: async () => buildLocalFallbackCatalog(),
      });

    const parsed = parseCatalogJson(catalog as unknown);
    if (!parsed.ok) {
      const fb = parseCatalogJson(buildLocalFallbackCatalog());
      if (!fb.ok) {
        return { ok: false, message: parsed.message };
      }
      return {
        ...fb,
        catalogSource: "fallback",
        degradedReason:
          [degradedReason, "Canonical catalog failed validation; using local fallback."]
            .filter(Boolean)
            .join(" "),
      };
    }

    return {
      ...parsed,
      catalogSource: source,
      degradedReason:
        source === "fallback" ? degradedReason : undefined,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Catalog request failed.";
    const fb = parseCatalogJson(buildLocalFallbackCatalog());
    if (!fb.ok) {
      return { ok: false, message: msg };
    }
    return {
      ...fb,
      catalogSource: "fallback",
      degradedReason: msg,
    };
  }
}

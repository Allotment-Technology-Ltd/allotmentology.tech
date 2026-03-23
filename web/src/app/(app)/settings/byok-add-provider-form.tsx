"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BYOK_PROVIDER_PRESETS,
  getByokPresetById,
  type ByokProviderPreset,
} from "@/lib/ai/byok-provider-presets";
import type { ByokCatalogClientPayload } from "@/lib/restormel-keys/catalog";

import {
  addProviderKeyAction,
  validateByokKeyAction,
  type ByokActionState,
} from "./byok-actions";

const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";
const label = "mb-1 block text-xs font-medium text-zinc-500";

const empty: ByokActionState = {};

const defaultPreset = BYOK_PROVIDER_PRESETS[0]!;

/** Survives soft navigations; keyed by catalog contract version. */
const BYOK_CATALOG_DRAFT_KEY = "allotment.byok.catalogDraft.v1";

export function ByokAddProviderForm(props: {
  catalog: ByokCatalogClientPayload | null;
  catalogError: string | null;
  catalogSource: "restormel" | "fallback" | null;
  catalogDegradedReason: string | null;
  onAddNewKey: () => void;
}) {
  const useCatalog = Boolean(
    props.catalog?.providers.length && props.catalog.models.length,
  );

  return (
    <>
      {props.catalogError ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          <p className="font-medium text-amber-100">Restormel catalog unavailable</p>
          <p className="mt-1 text-amber-100/80">
            Using the built-in provider list until the feed recovers. ({props.catalogError})
          </p>
        </div>
      ) : null}

      {props.catalog &&
      (props.catalogSource === "fallback" || props.catalogDegradedReason) ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          <p className="font-medium text-amber-100">Degraded catalog</p>
          <p className="mt-1 text-amber-100/80">
            Source: {props.catalogSource ?? "unknown"}.
            {props.catalogDegradedReason
              ? ` ${props.catalogDegradedReason}`
              : " Using the built-in fallback list until the canonical feed is reachable."}
          </p>
        </div>
      ) : null}

      {useCatalog && props.catalog ? (
        <CatalogAddProviderSection
          catalog={props.catalog}
          onAddNewKey={props.onAddNewKey}
        />
      ) : (
        <PresetAddProviderSection onAddNewKey={props.onAddNewKey} />
      )}
    </>
  );
}

function CatalogAddProviderSection(props: {
  catalog: ByokCatalogClientPayload;
  onAddNewKey: () => void;
}) {
  const router = useRouter();
  const firstPid = props.catalog.providers[0]!.id;
  const [providerId, setProviderId] = useState(firstPid);

  const modelsForProvider = useMemo(
    () => props.catalog.models.filter((m) => m.catalogProviderId === providerId),
    [props.catalog.models, providerId],
  );

  const [modelId, setModelId] = useState(() => {
    const list = props.catalog.models.filter((m) => m.catalogProviderId === firstPid);
    return list[0]?.providerModelId ?? "";
  });

  const modelIdInCatalogList = useMemo(
    () => modelsForProvider.some((m) => m.providerModelId === modelId),
    [modelsForProvider, modelId],
  );

  /** Prefer the model row’s `catalogProviderId` so POST matches variant `providerType` (fixes draft/orphan desync). */
  const catalogRowForModel = useMemo(
    () => props.catalog.models.find((m) => m.providerModelId === modelId),
    [props.catalog.models, modelId],
  );

  const effectiveCatalogProviderId =
    catalogRowForModel?.catalogProviderId ?? providerId;

  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const providerDisplayName = useMemo(() => {
    return (
      props.catalog.providers.find((p) => p.id === effectiveCatalogProviderId)
        ?.displayName ?? effectiveCatalogProviderId
    );
  }, [props.catalog.providers, effectiveCatalogProviderId]);

  const [validateState, validateAction, validatePending] = useActionState(
    validateByokKeyAction,
    empty,
  );
  const [addState, addAction, addPending] = useActionState(
    addProviderKeyAction,
    empty,
  );

  const restoredDraftRef = useRef(false);

  useEffect(() => {
    if (restoredDraftRef.current) return;
    try {
      const raw = sessionStorage.getItem(BYOK_CATALOG_DRAFT_KEY);
      if (!raw) {
        return;
      }
      const d = JSON.parse(raw) as {
        contractVersion?: string;
        providerId?: string;
        modelId?: string;
      };
      if (d.contractVersion !== props.catalog.contractVersion) {
        return;
      }
      if (d.providerId && props.catalog.providers.some((p) => p.id === d.providerId)) {
        setProviderId(d.providerId);
      }
      if (d.modelId && typeof d.modelId === "string") {
        setModelId(d.modelId);
      }
    } catch {
      /* ignore */
    } finally {
      restoredDraftRef.current = true;
    }
  }, [props.catalog.contractVersion, props.catalog.providers, props.catalog.models]);

  useEffect(() => {
    const row = props.catalog.models.find((m) => m.providerModelId === modelId);
    if (row && row.catalogProviderId !== providerId) {
      setProviderId(row.catalogProviderId);
    }
  }, [modelId, props.catalog.models, providerId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        BYOK_CATALOG_DRAFT_KEY,
        JSON.stringify({
          contractVersion: props.catalog.contractVersion,
          providerId,
          modelId,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [props.catalog.contractVersion, providerId, modelId]);

  useEffect(() => {
    if (!addState.success) return;
    queueMicrotask(() => {
      try {
        sessionStorage.removeItem(BYOK_CATALOG_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setApiKey("");
      setIsDefault(false);
      router.refresh();
    });
  }, [addState.success, router]);

  function onProviderChange(id: string) {
    setProviderId(id);
    const list = props.catalog.models.filter((m) => m.catalogProviderId === id);
    setModelId(list[0]?.providerModelId ?? "");
  }

  function onModelChange(id: string) {
    setModelId(id);
    const row = props.catalog.models.find((m) => m.providerModelId === id);
    if (row) setProviderId(row.catalogProviderId);
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-100">Add provider</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Lists come from the Restormel Keys catalog. You only pick provider, model, and paste your
            key; routing to the correct API is automatic. If validation fails, the model id may be
            retired (for example Anthropic 404) — choose a current id from the list or vendor docs,
            then save again.
          </p>
        </div>
        <button
          type="button"
          onClick={props.onAddNewKey}
          className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700"
        >
          Add new key
        </button>
      </div>

      <form className="space-y-4">
        <input type="hidden" name="catalogProviderId" value={effectiveCatalogProviderId} />
        <input type="hidden" name="providerName" value={providerDisplayName} />
        <input type="hidden" name="baseUrl" value="" />
        <input type="hidden" name="isDefault" value={isDefault ? "on" : ""} />
        {/* Single source of truth for POST body — avoids browser select/value drift */}
        <input type="hidden" name="model" value={modelId} />

        <div>
          <label className={label} htmlFor="byok-catalog-provider">
            Provider
          </label>
          <select
            id="byok-catalog-provider"
            className={input}
            value={providerId}
            onChange={(e) => onProviderChange(e.target.value)}
          >
            {props.catalog.providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="byok-catalog-model">
            Model
          </label>
          {modelsForProvider.length === 0 ? (
            <p className="text-sm text-red-400">No models listed for this provider.</p>
          ) : (
            <>
              <select
                id="byok-catalog-model"
                required
                className={input}
                value={modelId}
                onChange={(e) => onModelChange(e.target.value)}
                aria-label="Model"
              >
                {modelsForProvider.map((m) => (
                  <option key={m.catalogModelKey} value={m.providerModelId}>
                    {m.label} ({m.providerModelId})
                  </option>
                ))}
                {modelId && !modelIdInCatalogList ? (
                  <option value={modelId}>
                    {modelId} (your selection — not in the list after last refresh; pick another
                    id or retry)
                  </option>
                ) : null}
              </select>
              {modelId && !modelIdInCatalogList ? (
                <p className="mt-1 text-xs text-amber-200/80">
                  The catalog refreshed and this model id is no longer in the picker. Your choice
                  is kept so it doesn’t jump to another model. Pick a current id from the list
                  above or from Anthropic’s docs.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div>
          <label className={label} htmlFor="byok-catalog-api-key">
            API key
          </label>
          <input
            id="byok-catalog-api-key"
            name="apiKey"
            type="password"
            autoComplete="off"
            className={input}
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste once — not shown again"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="rounded border-zinc-600"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Use this as my default for AI drafting
        </label>

        {validateState.error ?? validateState.success ? (
          <p
            className={
              validateState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"
            }
          >
            {validateState.error ?? validateState.success}
          </p>
        ) : null}
        {addState.error ?? addState.success ? (
          <p
            className={addState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"}
          >
            {addState.error ?? addState.success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            formAction={validateAction}
            disabled={
              validatePending ||
              !modelId.trim() ||
              (modelsForProvider.length === 0 && modelIdInCatalogList)
            }
            className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
          >
            {validatePending ? "Validating…" : "Validate key"}
          </button>
          <button
            type="submit"
            formAction={addAction}
            disabled={
              addPending ||
              !modelId.trim() ||
              (modelsForProvider.length === 0 && modelIdInCatalogList)
            }
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {addPending ? "Saving…" : "Save provider"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PresetAddProviderSection(props: { onAddNewKey: () => void }) {
  const router = useRouter();
  const [presetId, setPresetId] = useState(defaultPreset.id);

  const preset = useMemo(
    () => getByokPresetById(presetId) ?? defaultPreset,
    [presetId],
  );

  const modelOptions = preset.models;
  const [modelId, setModelId] = useState(() => modelOptions[0]?.id ?? "");
  const [modelText, setModelText] = useState("");

  const [manualBaseUrl, setManualBaseUrl] = useState(
    () => getByokPresetById(defaultPreset.id)?.baseUrl ?? "",
  );

  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [validateState, validateAction, validatePending] = useActionState(
    validateByokKeyAction,
    empty,
  );
  const [addState, addAction, addPending] = useActionState(
    addProviderKeyAction,
    empty,
  );

  useEffect(() => {
    if (!addState.success) return;
    queueMicrotask(() => {
      setApiKey("");
      setIsDefault(false);
      setModelText("");
      router.refresh();
    });
  }, [addState.success, router]);

  function handlePresetChange(id: string) {
    setPresetId(id);
    const p = getByokPresetById(id) ?? defaultPreset;
    const opts = p.models ?? [];
    setModelId(opts[0]?.id ?? "");
    setModelText("");
    if (p.manualBaseUrl) {
      setManualBaseUrl(p.baseUrl || "");
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-medium text-zinc-100">Add provider</h2>
        <button
          type="button"
          onClick={props.onAddNewKey}
          className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700"
        >
          Add new key
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Fallback while the Restormel catalog is unavailable: same idea — choose provider, model, and
        key. Fixed presets fill in the API base for you; Azure, local, and custom only add a base URL
        because it is account-specific.
      </p>

      <PresetAddProviderFieldsForm
        preset={preset}
        onPresetIdChange={handlePresetChange}
        presetId={presetId}
        modelId={modelId}
        onModelIdChange={setModelId}
        modelText={modelText}
        onModelTextChange={setModelText}
        manualBaseUrl={manualBaseUrl}
        onManualBaseUrlChange={setManualBaseUrl}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        isDefault={isDefault}
        onIsDefaultChange={setIsDefault}
        validateAction={validateAction}
        addAction={addAction}
        validatePending={validatePending}
        addPending={addPending}
        validateState={validateState}
        addState={addState}
      />
    </section>
  );
}

function PresetAddProviderFieldsForm(props: {
  preset: ByokProviderPreset;
  presetId: string;
  onPresetIdChange: (id: string) => void;
  modelId: string;
  onModelIdChange: (id: string) => void;
  modelText: string;
  onModelTextChange: (v: string) => void;
  manualBaseUrl: string;
  onManualBaseUrlChange: (v: string) => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  isDefault: boolean;
  onIsDefaultChange: (v: boolean) => void;
  validateAction: (formData: FormData) => void;
  addAction: (formData: FormData) => void;
  validatePending: boolean;
  addPending: boolean;
  validateState: ByokActionState;
  addState: ByokActionState;
}) {
  const {
    preset,
    presetId,
    onPresetIdChange,
    modelId,
    onModelIdChange,
    modelText,
    onModelTextChange,
    manualBaseUrl,
    onManualBaseUrlChange,
    apiKey,
    onApiKeyChange,
    isDefault,
    onIsDefaultChange,
    validateAction,
    addAction,
    validatePending,
    addPending,
    validateState,
    addState,
  } = props;

  const modelOptions = preset.models;
  const modelIdInPresetList = modelOptions.some((m) => m.id === modelId);

  return (
    <form className="space-y-4">
      <input type="hidden" name="catalogProviderId" value="" />
      <input type="hidden" name="providerName" value={preset.providerName} />
      <input type="hidden" name="isDefault" value={isDefault ? "on" : ""} />
      {modelOptions.length > 0 ? (
        <input type="hidden" name="model" value={modelId} />
      ) : null}

      <div>
        <label className={label} htmlFor="byok-provider-preset">
          Provider
        </label>
        <select
          id="byok-provider-preset"
          className={input}
          value={presetId}
          onChange={(e) => onPresetIdChange(e.target.value)}
        >
          {BYOK_PROVIDER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      {preset.manualBaseUrl ? (
        <div>
          <label className={label} htmlFor="byok-base-url">
            API base URL
          </label>
          <input
            id="byok-base-url"
            name="baseUrl"
            type="url"
            required
            className={input}
            value={manualBaseUrl}
            onChange={(e) => onManualBaseUrlChange(e.target.value)}
            placeholder={preset.baseUrlPlaceholder ?? "https://…/v1"}
          />
        </div>
      ) : (
        <input type="hidden" name="baseUrl" value={preset.baseUrl} />
      )}

      {modelOptions.length > 0 ? (
        <div>
          <label className={label} htmlFor="byok-model-select">
            Model
          </label>
          <select
            id="byok-model-select"
            required
            className={input}
            value={modelId}
            onChange={(e) => onModelIdChange(e.target.value)}
            aria-label="Model"
          >
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.id})
              </option>
            ))}
            {modelId && !modelIdInPresetList ? (
              <option value={modelId}>
                {modelId} (your selection — not in preset list after refresh)
              </option>
            ) : null}
          </select>
          {modelId && !modelIdInPresetList ? (
            <p className="mt-1 text-xs text-amber-200/80">
              Picker list changed; your model id is kept so it doesn’t jump. Choose a listed id or
              enter a custom deployment where offered.
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <label className={label} htmlFor="byok-model-text">
            Model / deployment id
          </label>
          <input
            id="byok-model-text"
            name="model"
            required
            className={input}
            value={modelText}
            onChange={(e) => onModelTextChange(e.target.value)}
            placeholder={preset.modelPlaceholder ?? "From provider documentation"}
          />
        </div>
      )}

      <div>
        <label className={label} htmlFor="byok-api-key">
          API key
        </label>
        <input
          id="byok-api-key"
          name="apiKey"
          type="password"
          autoComplete="off"
          className={input}
          required
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Paste once — not shown again"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="rounded border-zinc-600"
          checked={isDefault}
          onChange={(e) => onIsDefaultChange(e.target.checked)}
        />
        Use this as my default for AI drafting
      </label>

      {validateState.error ?? validateState.success ? (
        <p
          className={
            validateState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"
          }
        >
          {validateState.error ?? validateState.success}
        </p>
      ) : null}
      {addState.error ?? addState.success ? (
        <p
          className={addState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"}
        >
          {addState.error ?? addState.success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          formAction={validateAction}
          disabled={validatePending}
          className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
        >
          {validatePending ? "Validating…" : "Validate key"}
        </button>
        <button
          type="submit"
          formAction={addAction}
          disabled={addPending}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          {addPending ? "Saving…" : "Save provider"}
        </button>
      </div>
    </form>
  );
}

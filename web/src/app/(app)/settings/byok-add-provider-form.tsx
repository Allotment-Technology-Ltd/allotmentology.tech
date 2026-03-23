"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BYOK_PROVIDER_PRESETS,
  getByokPresetById,
  type ByokProviderPreset,
} from "@/lib/ai/byok-provider-presets";

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

export function ByokAddProviderForm(props: { onAddNewKey: () => void }) {
  const router = useRouter();
  const [presetId, setPresetId] = useState(defaultPreset.id);

  const preset = useMemo(
    () => getByokPresetById(presetId) ?? defaultPreset,
    [presetId],
  );

  const [validateState, validateAction, validatePending] = useActionState(
    validateByokKeyAction,
    empty,
  );
  const [addState, addAction, addPending] = useActionState(
    addProviderKeyAction,
    empty,
  );

  useEffect(() => {
    if (addState.success) {
      router.refresh();
    }
  }, [addState.success, router]);

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
        Choose a provider and model, paste your API key, then validate and save. Hosts must expose
        OpenAI-style{" "}
        <code className="rounded bg-zinc-800 px-1">POST …/chat/completions</code>.
      </p>

      <AddProviderFieldsForm
        preset={preset}
        presetId={presetId}
        onPresetIdChange={setPresetId}
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

function AddProviderFieldsForm(props: {
  preset: ByokProviderPreset;
  presetId: string;
  onPresetIdChange: (id: string) => void;
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
    validateAction,
    addAction,
    validatePending,
    addPending,
    validateState,
    addState,
  } = props;

  const modelOptions = preset.models;
  const firstModelId = modelOptions[0]?.id ?? "";

  return (
    <form className="space-y-4">
      <input type="hidden" name="providerName" value={preset.providerName} />

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
            key={`base-${presetId}`}
            name="baseUrl"
            type="url"
            required
            className={input}
            defaultValue={preset.baseUrl || ""}
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
            key={`model-sel-${presetId}`}
            name="model"
            required
            className={input}
            defaultValue={firstModelId}
          >
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.id})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className={label} htmlFor="byok-model-text">
            Model / deployment id
          </label>
          <input
            id="byok-model-text"
            key={`model-txt-${presetId}`}
            name="model"
            required
            className={input}
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
          placeholder="Paste once — not shown again"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="isDefault" className="rounded border-zinc-600" />
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

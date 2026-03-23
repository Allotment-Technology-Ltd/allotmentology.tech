"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  BYOK_DEFAULT_MODEL_HINT,
  BYOK_PRESET_IDS,
  BYOK_PRESET_LABEL,
} from "@/lib/ai/byok-presets";

import {
  clearByokCredentialsFormAction,
  saveByokCredentialsAction,
  validateByokKeyAction,
  type ByokActionState,
} from "./byok-actions";

const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";
const label = "mb-1 block text-xs font-medium text-zinc-500";

const emptyState: ByokActionState = {};

export type ByokSettingsInitial = {
  preset: (typeof BYOK_PRESET_IDS)[number];
  model: string;
  customBaseUrl: string;
  hasStoredKey: boolean;
  encryptionConfigured: boolean;
  envHasAi: boolean;
};

export function ByokSettingsForm({ initial }: { initial: ByokSettingsInitial }) {
  const router = useRouter();
  const [validateState, validateAction, validatePending] = useActionState(
    validateByokKeyAction,
    emptyState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveByokCredentialsAction,
    emptyState,
  );
  const [clearState, clearAction, clearPending] = useActionState(
    clearByokCredentialsFormAction,
    emptyState,
  );

  useEffect(() => {
    if (saveState.success || clearState.success) {
      router.refresh();
    }
  }, [saveState.success, clearState.success, router]);

  const validateMsg = validateState.error ?? validateState.success;
  const saveMsg = saveState.error ?? saveState.success;
  const clearMsg = clearState.error ?? clearState.success;

  const defaultModelHint =
    initial.preset === "custom"
      ? "model id on your host"
      : (BYOK_DEFAULT_MODEL_HINT[initial.preset] ?? "gpt-4o-mini");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
        <p>
          Keys are stored encrypted for your user account when{" "}
          <code className="rounded bg-zinc-800 px-1">BYOK_ENCRYPTION_KEY</code>{" "}
          is set on the server. Your saved settings override shared environment
          variables for AI calls.
        </p>
        {!initial.encryptionConfigured ? (
          <p className="mt-2 text-amber-400/90">
            Saving is disabled until{" "}
            <code className="rounded bg-zinc-800 px-1">BYOK_ENCRYPTION_KEY</code>{" "}
            (32+ characters) is configured. You can still validate a key to test
            connectivity.
          </p>
        ) : null}
        {initial.envHasAi && !initial.hasStoredKey ? (
          <p className="mt-2 text-zinc-500">
            Server environment already provides an AI key; add your own below to
            use your account instead.
          </p>
        ) : null}
      </div>

      <form className="space-y-4">
        <div>
          <label className={label} htmlFor="providerPreset">
            Provider
          </label>
          <select
            id="providerPreset"
            name="providerPreset"
            className={input}
            defaultValue={initial.preset}
            required
          >
            {BYOK_PRESET_IDS.map((id) => (
              <option key={id} value={id}>
                {BYOK_PRESET_LABEL[id]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="model">
            Model
          </label>
          <input
            id="model"
            name="model"
            className={input}
            defaultValue={initial.model}
            placeholder={defaultModelHint}
            required
          />
          <p className="mt-1 text-xs text-zinc-600">
            Example: {defaultModelHint}
          </p>
        </div>

        <div>
          <label className={label} htmlFor="customBaseUrl">
            API base URL (optional)
          </label>
          <input
            id="customBaseUrl"
            name="customBaseUrl"
            className={input}
            defaultValue={initial.customBaseUrl}
            placeholder='Required for Custom; optional override for Restormel'
          />
          <p className="mt-1 text-xs text-zinc-600">
            Custom: full OpenAI-compatible base (…/v1). Restormel: leave blank
            to use the default API host unless you need an override.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="apiKey">
            API key
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            autoComplete="off"
            className={input}
            placeholder={
              initial.hasStoredKey
                ? "Leave blank to keep your saved key"
                : "sk-… or rk_…"
            }
          />
        </div>

        {validateMsg ? (
          <p
            className={
              validateState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"
            }
          >
            {validateMsg}
          </p>
        ) : null}
        {saveMsg ? (
          <p
            className={
              saveState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"
            }
          >
            {saveMsg}
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
            formAction={saveAction}
            disabled={savePending || !initial.encryptionConfigured}
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {savePending ? "Saving…" : "Save key"}
          </button>
        </div>
      </form>

      {initial.hasStoredKey ? (
        <form className="border-t border-zinc-800 pt-4">
          {clearMsg ? (
            <p
              className={
                clearState.error ? "mb-2 text-sm text-red-400" : "mb-2 text-sm text-emerald-400/90"
              }
            >
              {clearMsg}
            </p>
          ) : null}
          <button
            type="submit"
            formAction={clearAction}
            disabled={clearPending}
            className="text-sm text-red-400/90 hover:text-red-300 disabled:opacity-50"
          >
            {clearPending ? "Removing…" : "Remove saved key from this app"}
          </button>
        </form>
      ) : null}

      <p className="text-xs text-zinc-600">
        Docs:{" "}
        <a
          href="https://restormel.dev/keys/docs"
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 hover:underline"
        >
          restormel.dev/keys
        </a>{" "}
        (optional — you do not need the hosted dashboard to use this form.)
      </p>
    </div>
  );
}

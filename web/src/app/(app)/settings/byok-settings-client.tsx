"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { BYOK_PROVIDER_ENDPOINT_HINTS } from "@/lib/ai/byok-provider-hints";

import {
  addProviderKeyAction,
  revokeProviderKeyFormAction,
  setDefaultProviderKeyFormAction,
  validateByokKeyAction,
  type ByokActionState,
  type ByokKeyListItem,
} from "./byok-actions";

const input =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";
const label = "mb-1 block text-xs font-medium text-zinc-500";

const empty: ByokActionState = {};

export function ByokSettingsClient(props: {
  keys: ByokKeyListItem[];
  encryptsAtRest: boolean;
  envHasAi: boolean;
}) {
  const router = useRouter();
  const [validateState, validateAction, validatePending] = useActionState(
    validateByokKeyAction,
    empty,
  );
  const [addState, addAction, addPending] = useActionState(
    addProviderKeyAction,
    empty,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeProviderKeyFormAction,
    empty,
  );
  const [defaultState, defaultAction, defaultPending] = useActionState(
    setDefaultProviderKeyFormAction,
    empty,
  );

  useEffect(() => {
    if (addState.success || revokeState.success || defaultState.success) {
      router.refresh();
    }
  }, [addState.success, revokeState.success, defaultState.success, router]);

  const hintId = "byok-provider-hints";
  const urlHintId = "byok-url-hints";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
        <p>
          Save as many OpenAI-compatible providers as you need. Each entry stores a
          base URL (must end with your API version path, usually{" "}
          <code className="rounded bg-zinc-800 px-1">/v1</code>), a model id, and
          your key. Revoke an entry if a key is exposed; add a new row with a
          fresh key.
        </p>
        {props.encryptsAtRest ? (
          <p className="mt-2 text-zinc-500">
            Optional app-layer encryption is on:{" "}
            <code className="rounded bg-zinc-800 px-1">BYOK_ENCRYPTION_KEY</code>{" "}
            (8+ characters) is set on the server.
          </p>
        ) : (
          <p className="mt-2 text-zinc-500">
            Keys are stored in Neon like other app data. For stricter protection,
            set{" "}
            <code className="rounded bg-zinc-800 px-1">BYOK_ENCRYPTION_KEY</code>{" "}
            (8+ characters) in Vercel to encrypt values before they hit the
            database, or use Neon access rules / masking in the console.
          </p>
        )}
        {props.envHasAi && props.keys.length === 0 ? (
          <p className="mt-2 text-zinc-500">
            The server already has a shared AI key; add your own entries below to
            override for your account.
          </p>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Saved providers</h2>
        {props.keys.length === 0 ? (
          <p className="text-sm text-zinc-500">No active keys yet.</p>
        ) : (
          <ul className="space-y-3">
            {props.keys.map((k) => (
              <li
                key={k.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-100">
                      {k.label?.trim() || k.providerName}
                      {k.isDefault ? (
                        <span className="ml-2 rounded-full bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{k.providerName}</p>
                    <p className="mt-1 break-all text-zinc-400">{k.baseUrl}</p>
                    <p className="mt-1 text-zinc-300">
                      Model: <code className="rounded bg-zinc-800 px-1">{k.model}</code>
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Key on file (revoke if rotated or leaked).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!k.isDefault ? (
                      <form action={defaultAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <button
                          type="submit"
                          disabled={defaultPending}
                          className="rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          Use as default
                        </button>
                      </form>
                    ) : null}
                    <form action={revokeAction}>
                      <input type="hidden" name="id" value={k.id} />
                      <button
                        type="submit"
                        disabled={revokePending}
                        className="rounded-md px-2 py-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        onClick={(e) => {
                          if (!window.confirm("Revoke this key? You will need to add a new entry to use it again.")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Revoke
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {revokeState.error ? (
          <p className="text-sm text-red-400">{revokeState.error}</p>
        ) : null}
        {defaultState.error ? (
          <p className="text-sm text-red-400">{defaultState.error}</p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">Add provider</h2>
        <p className="text-xs text-zinc-500">
          Use any host that exposes OpenAI-style{" "}
          <code className="rounded bg-zinc-800 px-1">POST /v1/chat/completions</code>
          . Pick a hint below or paste your own URL and model id from the provider’s
          docs.
        </p>

        <datalist id={hintId}>
          {BYOK_PROVIDER_ENDPOINT_HINTS.map((h) => (
            <option key={h.name} value={h.name} />
          ))}
        </datalist>
        <datalist id={urlHintId}>
          {BYOK_PROVIDER_ENDPOINT_HINTS.map((h) => (
            <option key={h.baseUrl} value={h.baseUrl} />
          ))}
        </datalist>

        <form className="space-y-4">
          <div>
            <label className={label} htmlFor="label">
              Label (optional)
            </label>
            <input id="label" name="label" className={input} placeholder="e.g. Personal OpenAI" />
          </div>
          <div>
            <label className={label} htmlFor="providerName">
              Provider name
            </label>
            <input
              id="providerName"
              name="providerName"
              className={input}
              list={hintId}
              required
              placeholder="Any name — for your reference"
            />
          </div>
          <div>
            <label className={label} htmlFor="baseUrl">
              API base URL
            </label>
            <input
              id="baseUrl"
              name="baseUrl"
              className={input}
              list={urlHintId}
              required
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label className={label} htmlFor="model">
              Model
            </label>
            <input
              id="model"
              name="model"
              className={input}
              required
              placeholder="e.g. gpt-4o-mini, openai/gpt-4o, claude-3-5-sonnet (via compatible proxy)"
            />
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
              className={
                addState.error ? "text-sm text-red-400" : "text-sm text-emerald-400/90"
              }
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
      </section>
    </div>
  );
}

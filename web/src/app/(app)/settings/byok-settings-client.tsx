"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ByokCatalogClientPayload } from "@/lib/restormel-keys/catalog";

import {
  revokeProviderKeyFormAction,
  setDefaultProviderKeyFormAction,
  type ByokActionState,
  type ByokKeyListItem,
} from "./byok-actions";
import { ByokAddProviderForm } from "./byok-add-provider-form";

const empty: ByokActionState = {};

export function ByokSettingsClient(props: {
  keys: ByokKeyListItem[];
  encryptsAtRest: boolean;
  envHasAi: boolean;
  catalog: ByokCatalogClientPayload | null;
  catalogError: string | null;
  catalogSource: "restormel" | "fallback" | null;
  catalogDegradedReason: string | null;
}) {
  const router = useRouter();
  const [addFormKey, setAddFormKey] = useState(0);
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeProviderKeyFormAction,
    empty,
  );
  const [defaultState, defaultAction, defaultPending] = useActionState(
    setDefaultProviderKeyFormAction,
    empty,
  );

  useEffect(() => {
    if (revokeState.success || defaultState.success) {
      router.refresh();
    }
  }, [revokeState.success, defaultState.success, router]);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
        <p>
          You add <strong className="font-medium text-zinc-300">provider</strong>,{" "}
          <strong className="font-medium text-zinc-300">model</strong>, and{" "}
          <strong className="font-medium text-zinc-300">key</strong>; the app picks the right
          endpoint and protocol for that choice. Restormel Keys supplies the live catalog when
          reachable; otherwise the built-in list covers common OpenAI-compatible hosts. Validate,
          then save. Revoke a key if it leaks; use{" "}
          <strong className="font-medium text-zinc-300">Add new key</strong> for another provider.
        </p>
        {props.encryptsAtRest ? (
          <p className="mt-2 text-zinc-500">
            Optional app-layer encryption is on:{" "}
            <code className="rounded bg-zinc-800 px-1">BYOK_ENCRYPTION_KEY</code>{" "}
            (8+ characters) is set on the server.
          </p>
        ) : (
          <p className="mt-2 text-zinc-500">
            Keys are stored in Neon like other app data. For stricter protection, set{" "}
            <code className="rounded bg-zinc-800 px-1">BYOK_ENCRYPTION_KEY</code>{" "}
            (8+ characters) in Vercel to encrypt values before they hit the database, or use Neon
            access rules / masking in the console.
          </p>
        )}
        {props.envHasAi && props.keys.length === 0 ? (
          <p className="mt-2 text-zinc-500">
            The server already has a shared AI key; add your own entries below to override for your
            account.
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/25 p-4 text-sm text-zinc-400">
        <h2 className="text-base font-medium text-zinc-200">Catalog, presets, and fixing errors</h2>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-zinc-500">
          <li>
            <strong className="font-medium text-zinc-400">Live catalog</strong> — Restormel Keys
            serves the canonical provider/model list when the feed is healthy. The app filters out
            retired or unavailable models before building pickers.
          </li>
          <li>
            <strong className="font-medium text-zinc-400">Degraded / fallback</strong> — If you see an
            amber banner, the app is using a built-in preset list. You can still add keys; prefer
            validating before save. When the feed recovers, refresh this page for the full catalog.
          </li>
          <li>
            <strong className="font-medium text-zinc-400">401 / 403</strong> — Usually wrong host or
            key for the vendor (e.g. DeepSeek key needs DeepSeek base URL and model id). Same for
            every AI surface:{" "}
            <strong className="font-medium text-zinc-400">Mitchell</strong>, collateral, and
            submission packs all use your <strong className="font-medium text-zinc-400">default</strong>{" "}
            BYOK row (or server env AI when no key). One bad default key affects all of them — revoke
            it here to fall back.
          </li>
          <li>
            <strong className="font-medium text-zinc-400">404 on a model</strong> — Often a retired
            model id; pick a current id from the catalog or vendor docs, then re-save.
          </li>
          <li>
            <strong className="font-medium text-zinc-400">Packages</strong> — From{" "}
            <code className="rounded bg-zinc-800 px-1">web/</code>, run{" "}
            <code className="rounded bg-zinc-800 px-1">npm run restormel:patch</code> after upgrading{" "}
            <code className="rounded bg-zinc-800 px-1">@restormel/keys</code> so the catalog client
            stays aligned (see DEPLOYMENT.md).
          </li>
        </ul>
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
                    <p className="mt-1 break-all text-zinc-400">
                      <span className="text-zinc-500">Endpoint </span>
                      {k.baseUrl}
                    </p>
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
                          if (
                            !window.confirm(
                              "Revoke this key? You will need to add a new entry to use it again.",
                            )
                          ) {
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

      <ByokAddProviderForm
        key={addFormKey}
        catalog={props.catalog}
        catalogError={props.catalogError}
        catalogSource={props.catalogSource}
        catalogDegradedReason={props.catalogDegradedReason}
        onAddNewKey={() => setAddFormKey((k) => k + 1)}
      />
    </div>
  );
}

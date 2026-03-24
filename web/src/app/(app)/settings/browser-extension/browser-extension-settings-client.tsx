"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createBrowserAccessToken,
  revokeBrowserAccessToken,
  type BrowserAccessTokenListItem,
} from "../browser-extension-actions";

const btn =
  "rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50";
const dangerBtn =
  "rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/60 disabled:opacity-50";
const inputClass =
  "w-full max-w-md rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export function BrowserExtensionSettingsClient(props: {
  tokens: BrowserAccessTokenListItem[];
  appBaseUrl: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [pending, setPending] = useState(false);
  const [revokePending, setRevokePending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const apiUrl = props.appBaseUrl
    ? `${props.appBaseUrl.replace(/\/$/, "")}/api/mitchell/qa`
    : "(sign in on your deployment to see the URL)";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
        <p className="leading-relaxed">
          The Mitchell browser extension calls your workspace over HTTPS using a secret token (not
          your AI provider key). Install the extension from the repo&apos;s{" "}
          <code className="rounded bg-zinc-800 px-1 text-zinc-300">browser-extension/mitchell</code>{" "}
          folder, then paste <strong className="text-zinc-300">API base URL</strong>, this{" "}
          <strong className="text-zinc-300">token</strong>, and an{" "}
          <strong className="text-zinc-300">opportunity id</strong> (from the opportunity URL) in the
          extension options.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          API endpoint:{" "}
          <code className="rounded bg-zinc-900 px-1 text-zinc-400">{apiUrl}</code>
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-medium text-zinc-200">Create token</h2>
        <label className="block text-sm text-zinc-500" htmlFor="bt-label">
          Label (optional)
        </label>
        <input
          id="bt-label"
          className={inputClass}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Chrome laptop"
          maxLength={255}
        />
        <button
          type="button"
          className={btn}
          disabled={pending}
          onClick={async () => {
            setError(null);
            setNewToken(null);
            setPending(true);
            try {
              const r = await createBrowserAccessToken(label.trim() || null);
              if (!r.ok) {
                setError(r.error);
                return;
              }
              setNewToken(r.rawToken);
              setLabel("");
              router.refresh();
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Creating…" : "Generate new token"}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {newToken ? (
          <div className="rounded-md border border-amber-900/50 bg-amber-950/25 px-3 py-2 text-sm text-amber-100">
            <p className="font-medium text-amber-50">Copy this token now — it won’t be shown again.</p>
            <code className="mt-2 block break-all rounded bg-zinc-950 px-2 py-1 text-xs text-zinc-200">
              {newToken}
            </code>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-medium text-zinc-200">Active tokens</h2>
        {props.tokens.length === 0 ? (
          <p className="text-sm text-zinc-500">No tokens yet.</p>
        ) : (
          <ul className="space-y-2">
            {props.tokens.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-mono text-zinc-200">mitch_{t.tokenPrefix}…</p>
                  <p className="text-xs text-zinc-500">
                    {t.label ?? "No label"} · created{" "}
                    {t.createdAt.toLocaleString(undefined, { dateStyle: "medium" })}
                    {t.lastUsedAt
                      ? ` · last used ${t.lastUsedAt.toLocaleString(undefined, { dateStyle: "medium" })}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className={dangerBtn}
                  disabled={revokePending === t.id}
                  onClick={async () => {
                    setError(null);
                    setRevokePending(t.id);
                    try {
                      const r = await revokeBrowserAccessToken(t.id);
                      if (!r.ok) {
                        setError(r.error);
                        return;
                      }
                      router.refresh();
                    } finally {
                      setRevokePending(null);
                    }
                  }}
                >
                  {revokePending === t.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

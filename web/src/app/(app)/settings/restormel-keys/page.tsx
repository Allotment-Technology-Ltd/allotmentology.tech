import Link from "next/link";

import {
  RESTORMEL_KEYS_DASHBOARD_URL,
  RESTORMEL_KEYS_HOME,
  restormelKeysApiPortalUrl,
} from "@/lib/restormel-keys-urls";

export const dynamic = "force-dynamic";

const embedClass =
  "h-[65vh] w-full rounded-md border border-zinc-800 bg-zinc-950";

export default function RestormelKeysSettingsPage() {
  const apiPortalUrl = restormelKeysApiPortalUrl();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
          BYOK and AI provider routing
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Use the Restormel dashboard to sign in, connect provider keys, and
          define routes. The Gateway API reference lives on a separate docs host
          (Zuplo); open it in a new tab if embedding is blocked.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">BYOK quick start</h2>
        <ol className="list-decimal space-y-1 pl-4 text-sm text-zinc-300">
          <li>
            Open the{" "}
            <a
              href={RESTORMEL_KEYS_DASHBOARD_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
            >
              Restormel Keys dashboard
            </a>{" "}
            and sign in with GitHub.
          </li>
          <li>Create or select a workspace and project for this app.</li>
          <li>
            Connect provider credentials (OpenAI, Anthropic, etc.) and create
            routes as needed.
          </li>
          <li>
            Copy your Gateway key into Vercel as{" "}
            <code className="rounded bg-zinc-800 px-1">RESTORMEL_KEYS_API_KEY</code>{" "}
            and set{" "}
            <code className="rounded bg-zinc-800 px-1">AI_PROVIDER</code> to{" "}
            <code className="rounded bg-zinc-800 px-1">restormel-keys</code>, then
            run the writing agent from submission packs.
          </li>
        </ol>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={RESTORMEL_KEYS_DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 hover:bg-white"
          >
            Open dashboard (keys &amp; routes)
          </a>
          <a
            href={apiPortalUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
          >
            Gateway API reference
          </a>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href={RESTORMEL_KEYS_DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 hover:bg-white"
        >
          Dashboard
        </a>
        <a
          href={apiPortalUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
        >
          API portal (Zuplo)
        </a>
        <a
          href={`${RESTORMEL_KEYS_HOME}/docs/walkthrough/phase-0-inventory`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
        >
          Integration walkthrough
        </a>
      </div>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">
          Embedded dashboard
        </h2>
        <iframe
          title="Restormel Keys Dashboard"
          src={RESTORMEL_KEYS_DASHBOARD_URL}
          className={embedClass}
        />
        <p className="text-xs text-zinc-500">
          If this panel is blank or blocked, open the dashboard in a new tab
          using the button above.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">
          Gateway API reference
        </h2>
        <p className="text-sm text-zinc-400">
          The interactive API docs are hosted on Zuplo (linked from the official
          dashboard as &quot;API portal&quot;). We do not embed them here because
          many doc sites block iframes.
        </p>
        <a
          href={apiPortalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Open API portal in new tab →
        </a>
      </section>

      <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5 text-sm text-zinc-300">
        <h2 className="text-lg font-medium text-zinc-100">
          Cursor development hooks
        </h2>
        <p>
          For local development in Cursor, use Restormel Keys via MCP or AIPP
          alongside this UI. This app can use the Restormel adapter by setting{" "}
          <code className="rounded bg-zinc-800 px-1">AI_PROVIDER</code> to{" "}
          <code className="rounded bg-zinc-800 px-1">restormel-keys</code>.
        </p>
        <p className="text-xs text-zinc-500">
          Keep production credentials in Vercel environment variables, not in
          source code.
        </p>
      </section>

      <Link
        href="/settings"
        className="inline-block rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Back to settings
      </Link>
    </div>
  );
}

import Link from "next/link";

export const dynamic = "force-dynamic";

const embedClass =
  "h-[65vh] w-full rounded-md border border-zinc-800 bg-zinc-950";

export default function RestormelKeysSettingsPage() {
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
          Bring your own model-provider keys and control routing for the AI writing
          agent in one place. Use the embedded portal below, or open in a new tab
          if your browser blocks embedded sign-in.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">BYOK quick start</h2>
        <ol className="list-decimal space-y-1 pl-4 text-sm text-zinc-300">
          <li>Open the BYOK portal.</li>
          <li>Add your provider key (OpenAI, Anthropic, etc).</li>
          <li>Set the default routed model for writing tasks.</li>
          <li>Return to submission packs and run the writing agent.</li>
        </ol>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="https://restormel.dev/keys/api-portal"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 hover:bg-white"
          >
            Manage BYOK keys
          </a>
          <a
            href="https://restormel.dev/keys/dashboard"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
          >
            Open routing dashboard
          </a>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href="https://restormel.dev/keys/api-portal"
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 hover:bg-white"
        >
          Open BYOK portal
        </a>
        <a
          href="https://restormel.dev/keys/dashboard"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
        >
          Open dashboard
        </a>
        <a
          href="https://restormel.dev/keys/docs/walkthrough/phase-0-inventory"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
        >
          Integration walkthrough
        </a>
      </div>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">
          Embedded BYOK portal
        </h2>
        <iframe
          title="Restormel Keys BYOK Portal"
          src="https://restormel.dev/keys/api-portal"
          className={embedClass}
        />
        <p className="text-xs text-zinc-500">
          If this panel does not load, use the Manage BYOK keys button above to
          open it in a new tab and sign in there.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">
          Embedded routing dashboard
        </h2>
        <iframe
          title="Restormel Keys Dashboard"
          src="https://restormel.dev/keys/dashboard"
          className={embedClass}
        />
      </section>

      <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5 text-sm text-zinc-300">
        <h2 className="text-lg font-medium text-zinc-100">
          Cursor development hooks
        </h2>
        <p>
          For local development in Cursor, use Restormel Keys via MCP or AIPP
          alongside this embedded UI. This app already supports switching the
          AI backend by setting{" "}
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

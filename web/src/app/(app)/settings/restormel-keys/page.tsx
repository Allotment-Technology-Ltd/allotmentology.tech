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
          Restormel Keys
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Manage provider keys and routing for AI submission writing in one
          place. Use the embedded dashboard below, or open it in a new tab if
          your browser blocks embedded sign-in.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href="https://restormel.dev/keys/dashboard"
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 hover:bg-white"
        >
          Open dashboard
        </a>
        <a
          href="https://restormel.dev/keys/api-portal"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
        >
          Open API portal
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
          Embedded Restormel Dashboard
        </h2>
        <iframe
          title="Restormel Keys Dashboard"
          src="https://restormel.dev/keys/dashboard"
          className={embedClass}
        />
        <p className="text-xs text-zinc-500">
          If this panel does not load, open the dashboard in a new tab and sign
          in there.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-5">
        <h2 className="text-lg font-medium text-zinc-100">
          Embedded API Portal
        </h2>
        <iframe
          title="Restormel Keys API Portal"
          src="https://restormel.dev/keys/api-portal"
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

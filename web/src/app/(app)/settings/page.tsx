import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Sign-in, profile, and security are handled by Neon Auth. Funding-op
          data (opportunities, packs, collateral) lives in your Neon Postgres
          database.
        </p>
      </div>

      <ul className="max-w-lg space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm">
        <li>
          <Link
            href="/account/settings"
            className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
          >
            Account settings
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500">Profile and preferences</p>
        </li>
        <li>
          <Link
            href="/account/security"
            className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
          >
            Security
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500">Password and sessions</p>
        </li>
        <li>
          <Link
            href="/opportunities"
            className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
          >
            Back to opportunities
          </Link>
        </li>
      </ul>

      <p className="max-w-xl text-xs text-zinc-600">
        Environment variables (database URL, auth URL, optional AI keys) are not
        editable here — configure them in Vercel or your host, and locally in{" "}
        <code className="rounded bg-zinc-800 px-1 text-zinc-300">web/.env</code>
        . See <code className="rounded bg-zinc-800 px-1">DEPLOYMENT.md</code> at
        the repo root.
      </p>
    </div>
  );
}

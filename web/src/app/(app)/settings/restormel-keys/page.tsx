import Link from "next/link";

import { loadByokSettingsPageData } from "../byok-actions";
import { ByokSettingsClient } from "../byok-settings-client";

export const dynamic = "force-dynamic";

export default async function ByokAiKeysSettingsPage() {
  const data = await loadByokSettingsPageData();
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
          BYOK and AI provider routing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Add any OpenAI-compatible API: paste the base URL and model id from your
          provider’s documentation, validate, then save. Manage multiple keys and
          revoke any that should no longer be used.
        </p>
      </div>

      <ByokSettingsClient
        keys={data.keys}
        encryptsAtRest={data.encryptsAtRest}
        envHasAi={data.envHasAi}
      />

      <Link
        href="/settings"
        className="inline-block rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Back to settings
      </Link>
    </div>
  );
}

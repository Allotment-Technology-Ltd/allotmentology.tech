import { headers } from "next/headers";
import Link from "next/link";

import { listBrowserAccessTokens } from "../browser-extension-actions";
import { BrowserExtensionSettingsClient } from "./browser-extension-settings-client";

export const dynamic = "force-dynamic";

export default async function BrowserExtensionSettingsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appBaseUrl = host ? `${proto}://${host}` : "";

  const tokens = await listBrowserAccessTokens();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/settings" className="text-sky-400 hover:text-sky-300 hover:underline">
            Settings
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
          Browser extension
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Use Mitchell on funding portals: the extension sends the active field text to the same
          API as the in-app Q&amp;A flow, scoped to an opportunity you choose.
        </p>
      </div>

      <BrowserExtensionSettingsClient tokens={tokens} appBaseUrl={appBaseUrl} />
    </div>
  );
}

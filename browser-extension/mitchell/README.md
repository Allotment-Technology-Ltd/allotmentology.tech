# Mitchell browser extension

Chrome extension (Manifest V3) that calls your deployment’s `POST /api/mitchell/qa` so you can run **Mitchell Q&A** from a funding portal: focus an application field, press **Alt+Shift+M** (configurable under `chrome://extensions/shortcuts`), and the draft response is written into the field.

## Setup

1. Apply the `browser_access_tokens` migration and deploy the app (`web/`).
2. In the app: **Settings → Browser extension** → generate a token (copy it once).
3. Chrome → **Extensions** → **Load unpacked** → select this `mitchell` folder.
4. Open the extension **Options** (toolbar icon or extension details). Set:
   - **API base URL** — e.g. `https://your-deployment.vercel.app` (same as shown on the Settings page when you’re logged in).
   - **Bearer token** — the token from step 2.
   - **Opportunity id** — UUID from `/opportunities/<uuid>/edit`.
   - **Default notes** (optional) — appended as Mitchell “notes” on every request.

## Limitations

- Works best when the form field lives in the **top document**. Many portals put fields in **iframes**; if nothing happens, use in-app Q&A and paste, or we can extend the extension later with frame targeting.
- You are responsible for complying with each portal’s terms of use.
- Tokens are revocable from **Settings → Browser extension**.

## Development

Files are plain JS (no bundler). After edits, reload the extension on `chrome://extensions`.

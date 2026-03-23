# Allotment Technology — manual runbook (local, Neon, Vercel, Git)

Use this checklist whenever you clone the repo, create a new environment, or onboard someone.

## 1. Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (Postgres + Neon Auth)
- Optional: OpenAI (or compatible) API key for `src/lib/ai/*`
- Optional: [Vercel](https://vercel.com) for hosting
- Optional: [GitHub](https://github.com) repo (e.g. `Allotment-Technology-Ltd/allotmentology.tech`)

---

## 2. Git repository

The project root is **`allotment-technology-ltd/`**. The Next.js app lives in **`web/`**.

```bash
cd /path/to/allotment-technology-ltd
git init
git branch -M main
git remote add origin https://github.com/Allotment-Technology-Ltd/allotmentology.tech.git
# After files exist:
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 3. Neon — database and credentials

### 3.1 Create a project and branch

1. Neon Console → **Create project** (choose region close to users).
2. Copy the **connection string** (role `neondb_owner` or your app role).  
   - **Where to save (local):** `web/.env` as `DATABASE_URL` (never commit this file).
   - **Where to save (Vercel):** Project → Settings → Environment Variables → `DATABASE_URL` (Production + Preview as needed).

### 3.2 Run migrations (required)

From **`web/`** with `DATABASE_URL` set:

```bash
cd web
cp .env.example .env
# Edit .env: set DATABASE_URL=postgresql://...?sslmode=require

npm install
npm run db:migrate
```

**Migrations on disk:** `web/drizzle/*.sql` in journal order (see `web/drizzle/meta/_journal.json`). Applied via Drizzle Kit.

**When to re-run:** After every `git pull` that adds a new file under `web/drizzle/*.sql`, run `npm run db:migrate` against each environment (local, Neon preview branch, production) that should match the new schema.

**Release gate:** Production and preview deploys should use **`npm run vercel-build`** (migrations then `next build`) so a failed migration **blocks** the deploy. Do not ship app code that expects columns your database does not have. If you cannot run migrate in CI, run `npm run db:migrate` manually against that environment **before** or immediately after merge.

**Optional seed (demo data only):**

```bash
npm run db:seed
```

---

## 4. Neon Auth — credentials

1. Neon Console → your project → **Branch** → **Auth** → **Configuration**.
2. Copy **Auth URL** (shape like `https://…neonauth…/neondb/auth`).

**Where to save:**

| Location | Variable | Notes |
|----------|-----------|--------|
| `web/.env` (local) | `NEON_AUTH_BASE_URL` | Required for sign-in locally. |
| Vercel env | `NEON_AUTH_BASE_URL` | Same value for Production/Preview. |

3. Enable **Google** (or other) provider per [Neon OAuth guide](https://neon.com/docs/auth/guides/setup-oauth).
4. Add redirect / trusted origins for:
   - `http://localhost:3000` (dev)
   - Your Vercel URL(s), e.g. `https://your-app.vercel.app`

**App user sync:** After sign-in, `ensureAppUser()` creates/updates `public.users` keyed by email.

---

## 5. AI layer (optional)

**Where to save:**

| Location | Variables |
|----------|-----------|
| `web/.env` | `AI_PROVIDER` (`openai-compatible` or `restormel-keys`), plus either OpenAI-style vars (`AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`) or Restormel vars (`RESTORMEL_KEYS_API_KEY` / `RESTORMEL_KEYS_BASE_URL` / `RESTORMEL_KEYS_MODEL`) |
| Vercel | Same names if you use AI in production |
| Per-user BYOK (optional) | After migration `0007_*`, users can save keys under **Settings → BYOK & AI keys**. Set `BYOK_ENCRYPTION_KEY` (32+ random characters) in `web/.env` / Vercel so keys can be encrypted at rest. |

If unset, the app runs; AI server actions return a clear “not configured” message. If a user saves BYOK in the UI, that configuration takes precedence over shared environment variables for that user’s AI calls.

**BYOK provider/model catalog (split of responsibilities):**

- **Restormel Keys** owns catalog contract, patch path, and (in the SDK) helpers such as `fetchCanonicalCatalogWithFallback` and, when published, `filterCanonicalCatalogForViability`.
- **Allotment** owns wiring: server-side fetch via `fetchCanonicalCatalogWithFallback` (with `RESTORMEL_KEYS_BASE` / `RESTORMEL_KEYS_CATALOG_URL` as needed), then **`filterCanonicalCatalogForViability`** in `web/src/lib/restormel-keys/catalog.ts` (uses the Restormel export when present, then applies local lifecycle/denylist/availability gating before BYOK pickers). Never call the catalog from the browser.
- **Ops:** do not log raw API keys; log provider id, model id, HTTP status, and route name only. Run **`npm run db:migrate`** (or your deploy pipeline’s migrate step) on every deploy independently of Restormel package bumps.
- **BYOK vs catalog:** each `providers[]` row should include `validation` (`mode`, `requiresBaseUrl`). For OpenAI-compatible clients when `requiresBaseUrl === false`, use **`validation.defaultApiBaseUrl`** (Restormel Keys `@restormel/keys` ≥0.2.7). If `requiresBaseUrl === true`, collect the base URL in your app. Allotment resolves keys and storage from the catalog row, not a hardcoded provider id list.

The Settings UI loads the canonical catalog from `GET /keys/dashboard/api/catalog` (default origin `https://restormel.dev` unless overridden). Set `RESTORMEL_KEYS_CATALOG_URL` in `web/.env` / Vercel if you need a different origin.

**Upgrading Restormel packages:** Target **`@restormel/keys@^0.2.7`** and **`@restormel/keys-cli@^0.1.4`**; after version bumps run **`npm run restormel:patch`** from `web/` (runs `npx @restormel/keys-cli@0.1.4 patch`) so dependencies and catalog checks stay aligned. Verify with `npm view @restormel/keys version` and `npm view @restormel/keys-cli version`.

### Knowledge base and writing style setup

After migrations, open `/knowledge` and:

1. Add global knowledge assets (repo URLs, docs, portals, files).
2. Save a writing style profile (voice, guardrails, banned phrases, structure).
3. Add writing samples that match your submission voice.
4. Link relevant assets from each opportunity detail page under **Knowledge links**.

---

## 6. Local dev

```bash
cd web
npm run dev
```

Open `http://localhost:3000`. Unauthenticated users are redirected to `/auth/sign-in`.

---

## 7. Vercel deployment (simple path)

1. Vercel → **Add New Project** → import the GitHub repo.
2. **Root Directory:** `web`
3. **Framework Preset:** Next.js (auto).
4. **Environment variables** (minimum):

   - `DATABASE_URL` — use Neon’s **Vercel integration** if available (recommended), or paste the connection string.
   - `NEON_AUTH_BASE_URL` — same as local.

5. **Build command (recommended):** `npm run vercel-build` — runs `npm run db:migrate` then `npm run build` so production/preview databases stay in sync with the code **when `DATABASE_URL` is set in Vercel**. The default `npm run build` does **not** migrate (used by CI without a database).
6. **Install command:** `npm install` (default).

### Migrations against production

- **Preferred:** Set Vercel **Build Command** to `npm run vercel-build` (root directory `web`). Deploys fail fast if a migration cannot apply (DDL rights, bad URL).
- **Alternative:** Keep build as `npm run build` and run migrations manually (or in CI) after merges:

  ```bash
  cd web
  export DATABASE_URL="postgresql://...production..."
  npm run db:migrate
  ```

### Health check

After deploy, `GET /api/health` returns `{ "ok": true, "database": "connected" }` when Postgres is reachable. Use for smoke tests or uptime checks (no auth).

### Post-deploy smoke (recommended)

From `web/` with the deployed base URL (or local):

```bash
export SMOKE_BASE_URL="https://your-production-host"
npm run smoke:deploy
```

Then manually: sign in → **Settings → BYOK & AI keys** (catalog loads) → open **Submission packs** or **Opportunities** (DB-heavy list). AI paths share the same default BYOK key as Mitchell, collateral, and packs — see the BYOK page for degradation vs presets.

### Neon ↔ Vercel integration

In Neon, connect the Vercel project so preview deployments can receive **branch-specific** `DATABASE_URL` values. Align Preview env in Vercel with Neon **preview branches** if you use them.

---

## 8. CI (GitHub Actions)

This repo includes `.github/workflows/ci.yml`: on push/PR it runs `npm ci`, `npm run lint`, and `npm run build` in **`web/`** with a placeholder `NEON_AUTH_BASE_URL` so the Next.js build can compile.

**Secrets:** No `DATABASE_URL` in CI is required for that workflow (`npm run build` only). Production deploys should use `npm run vercel-build` in Vercel so migrations run against the real database.

---

## 9. Cursor — Restormel MCP

There is no Restormel-specific MCP server bundled in this repository’s default MCP list. To **use** a Restormel MCP when your team provides it:

1. Cursor → **Settings** → **MCP** → add the server per its install instructions.
2. Prefer that MCP for Restormel Keys product facts, URLs, and council/allotment context.

Project **Cursor rules** under `.cursor/rules/` describe when to use **contact@restormel.dev** vs **admin@usesophia.app** for submissions and comms.

---

## 10. Credential summary (quick)

| Secret / value | Store in |
|----------------|----------|
| Neon Postgres URL | `web/.env` → `DATABASE_URL`; Vercel → `DATABASE_URL` |
| Neon Auth URL | `web/.env` → `NEON_AUTH_BASE_URL`; Vercel → `NEON_AUTH_BASE_URL` |
| OAuth client IDs/secrets | Neon Auth configuration (not in this repo) |
| OpenAI (or compatible) key | `web/.env` / Vercel → `AI_API_KEY` or `OPENAI_API_KEY` |
| Restormel adapter key | `web/.env` / Vercel → `RESTORMEL_KEYS_API_KEY` (when `AI_PROVIDER=restormel-keys`) |
| BYOK encryption secret (optional) | `BYOK_ENCRYPTION_KEY` (8+ chars) — if set, encrypts user-saved API keys in the app before they are written to Postgres |


**Never commit:** `web/.env`, production URLs with embedded passwords, API keys.

---

## 11. Troubleshooting

- **Migrate errors:** Ensure `DATABASE_URL` points at the correct Neon branch; user must have DDL rights.
- **Auth redirect loops:** Check Neon Auth trusted origins include exact scheme + host + port.
- **Build fails on `NEON_AUTH_BASE_URL`:** Set any non-empty placeholder for build-only contexts (see CI workflow).

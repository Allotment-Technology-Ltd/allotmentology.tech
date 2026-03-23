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

**Migrations on disk:** `web/drizzle/0000_init.sql` through `0008_user_ai_provider_keys.sql` (applied in order via Drizzle).

**When to re-run:** After every `git pull` that adds a new file under `web/drizzle/*.sql`, run `npm run db:migrate` against each environment (local, Neon preview branch, production) that should match the new schema.

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

5. **Build command:** `npm run build` (default when root is `web`).
6. **Install command:** `npm install` (default).

### Migrations against production

Vercel’s build does **not** run migrations unless you add a step. Recommended for a small team:

- After merging schema changes, run locally (or in a trusted CI job with secrets):

  ```bash
  cd web
  export DATABASE_URL="postgresql://...production..."
  npm run db:migrate
  ```

- Alternatively, add a custom **Build Command** in Vercel: `npm run db:migrate && npm run build` (only if you accept deploy failure when migrations fail).

### Neon ↔ Vercel integration

In Neon, connect the Vercel project so preview deployments can receive **branch-specific** `DATABASE_URL` values. Align Preview env in Vercel with Neon **preview branches** if you use them.

---

## 8. CI (GitHub Actions)

This repo includes `.github/workflows/ci.yml`: on push/PR it runs `npm ci`, `npm run lint`, and `npm run build` in **`web/`** with a placeholder `NEON_AUTH_BASE_URL` so the Next.js build can compile.

**Secrets:** No `DATABASE_URL` in CI is required for that workflow. If you later add migration checks in CI, add a `DATABASE_URL` secret and a dedicated job.

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

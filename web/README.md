# Allotment Technology — funding ops (web)

Private internal app scaffold: Next.js App Router, Tailwind, Drizzle ORM, Neon Postgres.

For a full manual checklist (Neon, Auth, Vercel, Git, migrations, where to store secrets), see **[`../DEPLOYMENT.md`](../DEPLOYMENT.md)** at the repo root.

## Prerequisites

- Node 20+
- A [Neon](https://neon.tech) database (or any Postgres for local experimentation)

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres connection string (Drizzle, seed, `public.users` sync). |
| `NEON_AUTH_BASE_URL` | Yes | Neon Auth service URL from the Neon Console: **Project → Branch → Auth → Configuration**. |
| `AI_API_KEY` or `OPENAI_API_KEY` | No | Enables the Phase 8 AI layer (`src/lib/ai/*`): subagents, skills, and `ai_generation_logs`. |
| `AI_BASE_URL` | No | OpenAI-compatible API base including `/v1` (default `https://api.openai.com/v1`). |
| `AI_MODEL` | No | Chat model id (default `gpt-4o-mini`). |
| `AI_PROVIDER` | No | `openai-compatible` (default) or `restormel-keys`. |
| `RESTORMEL_KEYS_API_KEY` | No | Required when `AI_PROVIDER=restormel-keys`. |
| `RESTORMEL_KEYS_BASE_URL` | No | Optional adapter base URL (default `https://api.restormel.dev/v1`). |
| `RESTORMEL_KEYS_MODEL` | No | Optional adapter model id (default `restormel-writer-v1`). |

Google sign-in: enable the Google provider in the same Auth configuration screen and add your app origin (for example `http://localhost:3000`) under trusted / redirect settings as described in [Set up OAuth](https://neon.com/docs/auth/guides/setup-oauth).

## Setup

From **`web/`** (the Next.js app):

```bash
cd web
cp .env.example .env
# Edit .env: set DATABASE_URL and NEON_AUTH_BASE_URL to real Neon values (not placeholders).
npm install
npm run db:migrate
npm run db:seed   # optional
npm run dev
```

**Migrations on dev:** `npm run dev` (and `pnpm dev` from the repo root) runs **`drizzle-kit migrate` first**, then starts Next.js. Pending SQL in `drizzle/` is applied automatically when `DATABASE_URL` in `web/.env` points at your Neon database. To skip migrate (e.g. debugging), use `npm run dev:only` from `web/` or `npm run dev:only` from the repo root.

From the **repo root** (after `npm install` inside `web/` once): `npm run dev` runs migrate + dev (see root `package.json`). **pnpm** with `pnpm-workspace.yaml`: run `pnpm install` at the repo root, then `pnpm dev` (or `pnpm --filter web dev`).

If you see **`ENOTFOUND`** for auth, `NEON_AUTH_BASE_URL` is still a placeholder or wrong — copy the **Auth URL** from Neon Console → Branch → **Auth** → Configuration.

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are sent to `/auth/sign-in`. After Google (or email) sign-in, a row in `public.users` is created or updated to match the session email.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate SQL migrations from `src/db/schema` |
| `npm run db:migrate` | Apply migrations (`DATABASE_URL` required) |
| `npm run db:seed` | Insert demo rows (requires migrated schema). If **`funding-collateral-initial-pack-refined.md`** exists at the **repo root** (next to `web/`), each `## section` is imported as **approved** collateral with tags `initial-pack` + slug. |

## Routes (delivery plan alignment)

| Path | Purpose |
| --- | --- |
| `/` | Dashboard |
| `/opportunities`, `/opportunities/[id]` | Pipeline and detail |
| `/collateral`, `/collateral/[id]` | Collateral library |
| `/submission-packs`, `/submission-packs/[id]` | Submission packs |
| `/knowledge` | Global material links + writing style profile/samples |
| `/deadlines` | Task deadlines (alias: `/tasks` redirects here) |
| `/settings` | Hub linking to Neon Auth account pages |
| `/submissions`, `/submissions/[id]` | Redirect to `/submission-packs` (legacy) |

## Structure

- `src/app/(app)/` — protected app shell routes (middleware / proxy + Neon Auth session)
- `src/app/auth/` — Neon Auth UI (`/auth/sign-in`, `/auth/sign-up`, …)
- `src/app/api/auth/` — auth API proxy to Neon Auth
- `src/app/account/` — account settings (Neon Auth UI)
- `src/proxy.ts` — Next.js 16 proxy: requires sign-in for all routes except `/auth/*` and `/api/auth/*`
- `src/lib/auth/` — `createAuthServer` client, browser `authClient`, `ensureAppUser()` for `public.users`
- `src/components/` — shared UI (app shell / sidebar, auth provider)
- `src/db/` — Drizzle client, schema, seed
- `drizzle/` — generated migration SQL

## Opportunities (Phase 3)

- **List** (`/opportunities`): search + status filter, table with deadlines and formatted money, create / edit / delete.
- **Detail** (`/opportunities/[id]`): sections for overview, eligibility, internal notes, scoring (upsert), submission packs, tasks, and conflicts; quick-add and remove rows where relevant.
- **Forms** validated with Zod (`src/lib/opportunities/zod.ts`); dates and GBP/EUR/USD amounts use `src/lib/format.ts`.

After pulling schema changes, run `npm run db:migrate`.

## Scoring & triage (Phase 4)

- **Eight dimensions** (1–5 each) on `opportunity_scores`: eligibility, Restormel, and SOPHIA fit; cash and burn-reduction value; effort required (1 = light, 5 = heavy, inverted in the model); strategic value; time sensitivity.
- **Weighted overall** (0–100): weights renormalise across dimensions you fill in; see `src/lib/opportunities/scoring-engine.ts`.
- **Recommendation**: `apply_now` · `prepare` · `monitor` · `ignore` from overall + key dimensions.
- **UI**: triage card on the opportunity detail page; list columns for score, composite fit, and triage badge; sort by pipeline (default), deadline, or updated.

## AI operating layer (Phase 8)

- **Constitution & prompts**: `src/lib/ai/constitution.ts` — blunt, skeptical operator tone; no auto-submit; separate fact from guess.
- **Provider**: modular provider layer with OpenAI-compatible default plus Restormel adapter (`src/lib/ai/provider/`), selected by `AI_PROVIDER`.
- **Subagents** (typed JSON outputs): `opportunity-scout`, `eligibility-assessor`, `narrative-framer`, `application-drafter`, `conflict-checker`, `submission-operator` under `src/lib/ai/subagents/`.
- **Skills**: `classify-opportunity`, `score-opportunity-fit`, `choose-narrative-angle`, `generate-application-pack`, `detect-scope-conflict`, `compress-to-limit`, `extract-evidence` under `src/lib/ai/skills/`.
- **Audit trail**: each successful structured call writes to `ai_generation_logs` (run `npm run db:migrate` after pulling migration `0005_*`).
- **Provenance**: use `asVerified` / `asGenerated` from `src/lib/ai/types.ts` when composing UI or exports.
- **Runtime**: `createFundingOpsAiContext({ userId, opportunityId })` from `src/lib/ai/runtime.ts` (throws if AI is not configured).

## Knowledge base + style profile

- **Global knowledge library**: `/knowledge` stores reusable materials (repo/doc/file/portal URLs), summaries, and tags.
- **Per-opportunity links**: opportunity detail has a **Knowledge links** section to attach existing assets or create-and-link in one step.
- **Writing style profile**: `/knowledge` includes voice description, markdown guardrails, banned phrases, and preferred structure.
- **Writing samples**: add representative text samples used as few-shot style cues for submission drafting.
- **AI drafting**: pack drafting now incorporates linked knowledge + style profile/samples and returns review metadata (citations needed, banned phrase hits, confidence).

## v1 definition of done (verify before “done”)

From the sequenced delivery plan §11 — tick these in **production** (or local with real Neon) when you believe v1 is complete:

- [ ] Sign in with **Google** (Neon Auth + trusted origins configured).
- [ ] **Create and edit opportunities** (`/opportunities`, detail, forms).
- [ ] **Score** opportunities (eight dimensions + triage on detail and list).
- [ ] **Collateral**: store items, **approval** flag, versions (`/collateral`).
- [ ] **Submission packs**: create from opportunity, edit fields + checklist, **export Markdown** (`/submission-packs`).
- [ ] **Deadlines / tasks**: tasks on opportunities, **deadlines view** (`/deadlines`).
- [ ] **AI**: optional — set `AI_API_KEY`; draft/review via server actions in `opportunity-ai-actions.ts`, `pack-ai-actions.ts`, and `src/lib/ai/*` (wire more UI if needed).
- [ ] **Deployed** (e.g. Vercel) and **private** (auth required); usable for real funding work immediately.

If the above works, **stop building and use the tool** — then iterate only from real usage.

## Deferred (plan §12 — not v1)

Do **not** scope these into v1 unless you explicitly reopen them: source scanning automation, email reminders, watchlist refresh jobs, richer conflict analysis, provider switching via Restormel Keys, browser-assist workflow, multi-user collaborator UX, attachments management, heavy source-ingestion pipelines.

## Recommended build order & how to work (plan §13)

Fastest sane path: **scaffold → schema → auth → opportunities → scoring → collateral → submission packs → deadlines/tasks → AI core → polish/deploy**. Use **tight steps** in Cursor: finish each slice and prove it (migrate, click path, build) before the next phase.

## Scope summary

Internal funding ops workspace: Neon Auth, Postgres via Drizzle, opportunities through submission packs and deadlines, optional OpenAI-compatible AI layer with audit logging (`ai_generation_logs`).

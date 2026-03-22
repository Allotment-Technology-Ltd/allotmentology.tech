# Allotment Technology Funding Ops
## Sequenced development delivery plan

This document pulls together the product spec, architecture, AI core, and Cursor implementation order into one practical build sequence you can use today.

The goal is to get a private internal funding operations app built fast enough to use immediately, without overbuilding it into a platform.

---

# 1. Product outcome

Build a private internal app for Allotment Technology Ltd that helps you:

- capture funding opportunities
- score and shortlist them
- generate reusable application collateral
- draft submission packs
- track deadlines, blockers, and missing inputs
- use a structured AI core with disciplined subagents
- prepare applications without automating final submission

This app is for:

- Restormel
- Restormel Keys
- SOPHIA
- founder-level funding operations

It is not:

- a public SaaS
- a browser bot
- a grant auto-submission system
- a generic startup CRM

---

# 2. Tech stack

- Domain: `allotmentlollogy.tech`
- Front end: Next.js App Router
- Deployment: Vercel
- Database: Neon Postgres
- ORM: Drizzle ORM
- Auth: Neon Auth with Google sign-in
- Styling: Tailwind CSS
- Validation: Zod
- Background tasks: Vercel Cron or scheduled route handlers
- AI layer: provider abstraction with room for Restormel Keys later

Rule:
Do not force Restormel Keys into v1.
Keep the AI layer provider-agnostic so Keys can be introduced later if useful.

---

# 3. Delivery principles

1. Ship a usable internal tool first.
2. Build the workflow before adding automation.
3. Keep all sensitive operations server-side.
4. Require human approval before any final submission.
5. Prefer clean tables and forms over clever UI.
6. Treat AI as an operator layer, not the entire app.
7. Separate verified facts from generated draft content.

---

# 4. v1 scope

## Must have
- private authenticated app
- dashboard
- opportunities CRUD
- opportunity scoring
- collateral library
- submission packs
- deadlines and tasks
- AI constitution
- AI subagents and skills
- deployment-ready setup

## Must not have in v1
- autonomous submission
- scraping-heavy infrastructure
- public multi-user collaboration
- billing
- advanced analytics
- OCR
- complex agent loops

---

# 5. Delivery sequence

Use this order exactly.

---

# Phase 0 — repo setup and guardrails
## Objective
Create a clean foundation so Cursor does not drift.

## Tasks
- create the Next.js app
- configure TypeScript
- configure Tailwind
- set up a clear folder structure
- add README with purpose and scope
- add `.env.example`
- add linting and formatting
- set up deployment target for Vercel
- define app-wide dark theme

## Deliverables
- running app
- clean project structure
- placeholder routes
- app shell with sidebar

## Cursor prompt
Use **Prompt 1 — create the app scaffold**

## Acceptance check
- app runs locally
- route structure exists
- no business logic yet
- layout feels coherent

---

# Phase 1 — database schema and seed data
## Objective
Create the minimum persistent data model.

## Tables
- users
- opportunities
- opportunity_scores
- collateral_items
- submission_packs
- tasks
- application_conflicts
- source_watchlist

## Tasks
- connect Neon Postgres
- set up Drizzle ORM
- define enums
- write schema
- add migrations
- create seed script
- seed realistic demo data

## Deliverables
- schema files
- migration files
- seed script
- local sample data

## Cursor prompt
Use **Prompt 2 — set up Neon database and Drizzle schema**

## Acceptance check
- migrations run cleanly
- seeded data loads
- schema matches product model
- no over-engineered relationships

---

# Phase 2 — authentication and route protection
## Objective
Make the app private and usable only by authenticated users.

## Tasks
- implement Neon Auth
- configure Google sign-in
- add auth route handler
- add protected route pattern
- add login page
- create user record on first sign-in
- add user menu and sign-out

## Deliverables
- working login flow
- protected routes
- local user record creation
- documented environment variables

## Cursor prompt
Use **Prompt 3 — implement Neon Auth with Google**

## Acceptance check
- Google sign-in works
- unauthenticated users cannot access private routes
- user profile appears in app shell
- auth config is documented

---

# Phase 3 — opportunities core workflow
## Objective
Make the app useful for real opportunity tracking.

## Pages
- opportunities list
- opportunity detail
- create/edit flows

## Tasks
- build opportunities table
- add filters
- add create/edit/delete
- create detail page sections:
  - overview
  - eligibility
  - notes
  - scoring
  - submission pack
  - tasks
  - conflicts
- validate forms with Zod
- format dates and currency cleanly

## Deliverables
- real CRUD for opportunities
- useful list page
- useful detail page

## Cursor prompt
Use **Prompt 4 — build the opportunities table and detail flow**

## Acceptance check
- you can store real opportunities
- filter and status views work
- deadlines are visible
- detail page supports the rest of the workflow

---

# Phase 4 — scoring and triage engine
## Objective
Turn a list of opportunities into a prioritised pipeline.

## Scores
- eligibility_fit
- restormel_fit
- sophia_fit
- cash_value
- burn_reduction_value
- effort_required
- strategic_value
- time_sensitivity

## Tasks
- build manual scoring UI
- add rationale field
- compute weighted overall score
- compute recommended action:
  - apply_now
  - prepare
  - monitor
  - ignore
- add visual status card
- show urgency and fit clearly

## Deliverables
- scoring form
- score summary
- recommendation logic

## Cursor prompt
Use **Prompt 5 — add the scoring engine**

## Acceptance check
- scoring is transparent
- recommendation is understandable
- overall score updates correctly
- opportunities can be triaged fast

---

# Phase 5 — collateral library
## Objective
Create reusable content blocks so applications are not drafted from scratch every time.

## Collateral types
- founder_bio
- company_overview
- restormel_summary
- restormel_keys_summary
- sophia_summary
- traction_note
- budget_assumption
- standard_answer
- asset_reference

## Tasks
- build collateral list page
- build create/edit/view flows
- use markdown storage
- add tags
- add approval flag
- add version display
- show pack references if possible

## Deliverables
- reusable collateral library
- approved content store
- markdown editing flow

## Cursor prompt
Use **Prompt 6 — build the collateral library**

## Acceptance check
- you can store and edit reusable copy
- items are easy to reference later
- approval state is visible

---

# Phase 6 — submission pack workflow
## Objective
Create copy-paste-ready application packs tied to each opportunity.

## Pack fields
- working_thesis
- project_framing
- summary_100
- summary_250
- draft_answers_md
- missing_inputs_md
- risks_md
- checklist_md
- status

## Tasks
- build submission pack page
- link pack from opportunity detail
- add status handling
- add checklist UI
- add markdown export
- add ready-to-submit guard

## Deliverables
- editable submission packs
- exportable markdown
- clear pack readiness state

## Cursor prompt
Use **Prompt 7 — build submission packs**

## Acceptance check
- pack can be used to fill a real grant form
- missing information is visible
- pack status is clear
- export works

---

# Phase 7 — tasks and deadlines
## Objective
Prevent lost deadlines and untracked blockers.

## Tasks
- build tasks linked to opportunities
- add due dates
- add deadlines page
- highlight next 7 and 14 days
- show overdue items
- surface missing founder inputs near deadlines

## Deliverables
- tasks workflow
- deadlines view
- urgency indicators

## Cursor prompt
Use **Prompt 8 — add tasks, reminders, and deadlines view**

## Acceptance check
- important deadlines are obvious
- tasks are actionable
- overdue items are visible
- app is usable as a real delivery tracker

---

# Phase 8 — AI core foundation
## Objective
Embed the app’s core operating intelligence.

## Core modules
- constitution
- subagents
- skills
- provider abstraction
- typed contracts
- generation logging

## Constitution goals
The app must behave like a disciplined funding operator:
- blunt
- structured
- skeptical
- practical
- no hallucination
- no auto-submit
- focused on meaningful founder-supporting value

## Subagents
- opportunity-scout
- eligibility-assessor
- narrative-framer
- application-drafter
- conflict-checker
- submission-operator

## Skills
- classify-opportunity
- score-opportunity-fit
- choose-narrative-angle
- generate-application-pack
- detect-scope-conflict
- compress-to-limit
- extract-evidence

## Tasks
- build `/lib/ai/constitution.ts`
- build typed subagent modules
- build skill modules
- build provider-agnostic AI service
- log source inputs and generation metadata
- separate verified vs generated content

## Deliverables
- AI operating layer
- typed subagent outputs
- reusable prompt skill library
- generation audit trail

## Cursor prompt
Use the **AI core prompt**:

```text
Add a core AI operating layer to the funding ops app.

Goal:
This app must behave like a disciplined internal funding operator for Allotment Technology Ltd, focused on Restormel and SOPHIA.

Implement the following:

1. A central AI constitution module that defines:
   - company context
   - funding priorities
   - behaviour rules
   - allowed classifications
   - no-hallucination policy
   - no-auto-submit rule

2. Subagent modules:
   - opportunity-scout
   - eligibility-assessor
   - narrative-framer
   - application-drafter
   - conflict-checker
   - submission-operator

3. Reusable skills:
   - classify-opportunity
   - score-opportunity-fit
   - choose-narrative-angle
   - generate-application-pack
   - detect-scope-conflict
   - compress-to-limit
   - extract-evidence

4. A clean provider-agnostic AI interface so prompts and orchestration are separated from provider code.

5. Clear typed input/output contracts for every subagent and skill.

6. Logging of:
   - source inputs
   - generation timestamps
   - subagent used
   - model/provider used
   - draft vs verified content boundaries

Constraints:
- server-side only
- no browser-side secret exposure
- no over-engineering
- no autonomous submission
- plain TypeScript modules
- make it easy to swap prompts and tune behaviour later

Definition of done:
- every subagent can be invoked independently
- the constitution is enforced centrally
- each subagent returns structured outputs
- the app can later connect these subagents into workflow actions in the UI
```

## Acceptance check
- AI modules compile
- subagents can be called independently
- constitution is centralised
- outputs are structured and auditable

---

# Phase 9 — AI actions in the UI
## Objective
Make the AI layer usable inside the app.

## Tasks
- add “Generate draft” to submission pack page
- add “Suggest conflicts” to opportunity detail page
- add “Choose angle” action
- add “Summarise opportunity” action
- show generated content with clear labels
- let user copy generated content into editable fields
- do not overwrite manual content silently

## Deliverables
- visible AI actions
- draft generation workflow
- conflict suggestions workflow

## Acceptance check
- AI actions save time
- generated content is clearly separated
- manual editing remains easy

---

# Phase 10 — polish and deployment
## Objective
Make the app clean enough to use for real work today.

## Tasks
- improve empty states
- improve loading and error states
- tighten spacing and layout
- document all env vars
- add README
- add minimal tests for auth and CRUD
- deploy to Vercel
- verify Neon connection in production
- verify Google login in production
- verify protected routes in production

## Deliverables
- deployable app
- stable README
- environment documentation
- production URL

## Cursor prompt
Use **Prompt 10 — polish, seed, and deploy**

## Acceptance check
- app works in production
- login works
- CRUD works
- AI layer works
- app is useful immediately

---

# 6. Recommended build order for today

If you are building this today, follow this exact practical sequence:

## Block 1 — foundation
1. Prompt 1
2. Prompt 2
3. Prompt 3

Goal:
Get the private shell running with auth and database.

## Block 2 — core workflow
4. Prompt 4
5. Prompt 5
6. Prompt 6
7. Prompt 7
8. Prompt 8

Goal:
Make the app actually usable for funding operations before touching AI.

## Block 3 — AI operator core
9. AI core prompt
10. wire AI actions into the relevant screens

Goal:
Make the app smarter only after the workflow exists.

## Block 4 — production finish
11. Prompt 10
12. deploy to Vercel
13. test with real opportunities

Goal:
Use the app today.

---

# 7. Suggested route structure

- `/` dashboard
- `/opportunities`
- `/opportunities/[id]`
- `/collateral`
- `/collateral/[id]`
- `/submission-packs`
- `/submission-packs/[id]`
- `/deadlines`
- `/settings`

Optional later:
- `/review`
- `/ai-lab`
- `/sources`

---

# 8. Suggested project structure

```text
app/
  (auth)/
  api/
  opportunities/
  collateral/
  submission-packs/
  deadlines/
  settings/

components/
  layout/
  opportunities/
  collateral/
  submission-packs/
  deadlines/
  ui/

lib/
  db/
  auth/
  ai/
    constitution.ts
    types.ts
    providers/
    skills/
    subagents/
  scoring/
  validations/
  utils/

drizzle/
  schema/
  migrations/

scripts/
  seed.ts
```

---

# 9. Minimum collateral to add immediately after build

As soon as the collateral library works, add these items manually:

- founder bio
- Allotment Technology company overview
- Restormel summary
- Restormel Keys summary
- SOPHIA summary
- current product status
- funding goal and runway target
- budget assumptions
- standard answer: why now
- standard answer: why this team
- standard answer: what problem exists
- standard answer: what differentiates the product
- standard answer: what gets built in 6 months
- standard answer: what gets built in 12 months

Without this, the drafter will be much weaker.

---

# 10. Core AI personality

The app should not sound like a cheerful assistant.
It should sound like a serious funding operator.

## Personality traits
- skeptical
- structured
- plainspoken
- realistic
- no fluff
- no invention
- no false confidence

## Rules
- never invent traction
- never invent partners
- never invent pilot sites
- never invent financial figures
- never auto-submit
- always surface blockers
- always separate verified facts from generated text

---

# 11. Definition of done for v1

v1 is done when:

- you can sign in with Google
- you can create and edit opportunities
- you can score them
- you can store approved collateral
- you can create submission packs
- you can track deadlines and tasks
- you can use AI to draft and review
- you can export useful pack content
- the app is deployed and private
- you can use it immediately for real funding work

If those things work, stop building and use the tool.

---

# 12. What to build later, not now

After v1 is working and useful, consider:

- source scanning automation
- email reminders
- watchlist refresh jobs
- richer conflict analysis
- provider switching via Restormel Keys
- browser-assist workflow
- collaborator support
- attachments management
- source material ingestion improvements

But not yet.

---

# 13. Final practical instruction

Use Cursor in tight steps.
Do not ask it for the whole app in one giant prompt.
Make it finish each phase and prove it works before moving on.

The build order is:

1. scaffold
2. schema
3. auth
4. opportunities
5. scoring
6. collateral
7. submission packs
8. deadlines/tasks
9. AI core
10. polish/deploy

That is the fastest sane path to a working app today.

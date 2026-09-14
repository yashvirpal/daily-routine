# Daily Routine & Habit Tracker — Project Context

## Project Status

Status: Live in production
Phase: 1 — Core app + admin tooling (complete) → Phase 2 — Growth &
monetization (next, see Next Tasks)

## Product Goal

A modern daily routine and habit tracker with:
- Multi-user accounts (email/password) with an Admin/User role split
- Routine management
- Daily check-ins
- Daily/weekly/monthly/yearly analytics, both per-user and (for admins)
  aggregated across every user
- Streak tracking
- Responsive UI
- Deployed on Vercel (see ADR-008)

Phase 2 (see Next Tasks): password reset, transactional/reminder email,
Razorpay-backed subscriptions.

## Architecture

**A single, flat Next.js project at the repo root** — one `package.json`,
one `node_modules`, no monorepo layer. Frontend + API live in the same
process, via Next.js Route Handlers (`app/api/**`) instead of a separate
backend. This went through two rounds of consolidation, each an explicit
request (see ADR-006 and ADR-007):

1. Originally two apps (`apps/web` Next.js + `apps/api` NestJS) in an npm
   workspaces monorepo, plus two internal packages (`packages/database`,
   `packages/shared`).
2. ADR-006 merged the two **apps** into one (`apps/web`), dropping NestJS —
   but `packages/database`/`packages/shared` remained separate workspace
   packages, which still split `node_modules` between the repo root (most
   deps, hoisted) and `apps/web/node_modules` (a few platform-specific
   optional deps npm won't hoist, e.g. Tailwind's native binary).
3. ADR-007 finished the job: `apps/web`'s contents moved up to the repo
   root, `packages/database`'s Prisma schema became root `prisma/`, its
   client wrapper became `lib/db.ts`, and `packages/shared`'s types became
   `lib/types/`. No more `apps/`, `packages/`, or workspaces — just one
   `package.json` and exactly one `node_modules`.

- **Pages** (`app/**/page.tsx`, Server Components) read data by calling
  `lib/server/*` directly — no HTTP hop, no separate package to import from,
  it's all one process and one codebase now.
- **Client Components** (things the browser runs) mutate through
  `app/api/**` Route Handlers via `lib/api.ts` (same-origin fetch, no CORS).
- `lib/types/` — the JSON wire-format contract: what a Route Handler
  returns. Still matters even with reads going straight to `lib/server/*` —
  see "Server Components vs. Route Handlers" below for why.
- `e2e/` — Playwright end-to-end tests (still its own top-level folder; not
  part of the app bundle).

Internal organization uses Next.js **route groups** to keep the admin
section, the regular user-facing pages, and auth pages visually/physically
separate without affecting URLs:
```
app/
  (admin)/admin/page.tsx        -> /admin
  (app)/today/page.tsx          -> /today
  (app)/analytics/page.tsx      -> /analytics
  (app)/settings/page.tsx       -> /settings
  (auth)/login/page.tsx         -> /login
  (auth)/register/page.tsx      -> /register
  api/**                        -> /api/** (Route Handlers)
```
Components follow the same split: `components/admin/`, `components/frontend/`
(routines/checkins/analytics), `components/auth/`, plus shared
`components/ui/` (shadcn) and `components/nav.tsx`.

Docker: one `Dockerfile` at the repo root, `dev` target (used by
`docker-compose.yml`) + `runtime` target (production). See Docker below.

## Tech Stack

- Node.js: 20+ (LTS)
- TypeScript
- Next.js 16 (App Router, Turbopack) — frontend **and** API (Route Handlers)
- React 19
- Prisma 6
- PostgreSQL (shared instance — see below)
- Tailwind CSS v4
- shadcn/ui (Radix base)
- Radix UI
- Lucide
- Framer Motion
- Recharts (analytics charts)
- **Playwright** — end-to-end testing (added during foundation setup; was missing from the original spec)
- **jose + bcryptjs** — auth (JWT in an httpOnly cookie, signed/verified with `jose`; passwords hashed with bcrypt)
- **zod** — Route Handler input validation (replaces the NestJS DTOs/`class-validator` from before the merge)

Removed in the merge: NestJS, `@nestjs/*`, `class-validator`,
`class-transformer`, `cookie-parser`, `concurrently` (nothing left to run in
parallel — one app, one `npm run dev`).

## Database

This project does **not** run its own Postgres container. It connects to the
shared local dev DB stack in `../database` (docker-compose, external Docker
network `db-network` — see `[[shared-database-network]]` convention and
`../database/skills.md` for live credentials, which are gitignored/sensitive
and must not be pasted into chats, tickets, or commits).

It uses a dedicated `daily_routine` Postgres schema inside the shared `app`
database (via `?schema=daily_routine` on `DATABASE_URL`) so its tables don't
collide with other projects on the same stack.

## Environment Variables

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/app?schema=daily_routine
POSTGRES_PASSWORD=<password>          # used by docker-compose.yml to build the container DATABASE_URL
JWT_SECRET=<random 32+ byte hex>      # signs the auth cookie — generate your own, see .env.example
```

See `.env.example`. Real DB values (gitignored `.env`) are copied from
`../database/skills.md`; `JWT_SECRET` is generated per-environment (never
shared with the DB credentials).

`.env` lives at the repo root, which is now also Next.js's own project root
(no monorepo nesting), so Next.js auto-loads it natively — no `dotenv`
package needed (there was a brief period, during the apps/web+packages/*
layout, where it wasn't and a manual `dotenv` load in `next.config.ts`
worked around it; that's gone now, see ADR-007). Docker/Vercel don't need
this either way: they inject env vars directly, no `.env` file involved at
runtime.

## Database Schema

Multi-user: every `Routine` belongs to a `User` (`userId` FK, cascade
delete). There is no separate ownership on `DailyLog` — it's scoped
transitively through its `Routine`.

Dates are stored and compared as **UTC calendar days** (`@db.Date`, always
constructed from `YYYY-MM-DD` strings). This is a simplification: a "day"
boundary is UTC midnight, not the viewer's local midnight — for users east
of UTC this means the app's "today" can flip a few hours before their local
midnight. Would need a stored per-user timezone to do this properly; not
implemented.

### User

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | unique |
| passwordHash | String | bcrypt, never returned by a Route Handler |
| name | String? | |
| role | enum USER \| ADMIN | default USER |
| createdAt / updatedAt | DateTime | |

**The first user ever registered becomes `ADMIN` automatically** (checked at
register time via `user.count() === 0`) — there's no separate seed step or
admin-invite flow. Everyone who registers after that gets `USER`.

### Routine

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → User, cascade delete |
| name | String | |
| description | String? | |
| icon | String? | lucide-react icon name |
| color | String? | Tailwind color token |
| frequency | enum DAILY \| WEEKLY \| CUSTOM | default DAILY |
| daysOfWeek | Int[] | 0 (Sun)–6 (Sat); used for WEEKLY/CUSTOM |
| targetCount | Int | times per due day to mark complete, default 1 |
| isActive | Boolean | default true |
| sortOrder | Int | default 0 |
| createdAt / updatedAt | DateTime | |

### DailyLog (check-in)

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| routineId | String | FK → Routine, cascade delete |
| date | Date | the calendar day being logged (UTC) |
| completed | Boolean | default true |
| count | Int | default 1, supports targetCount > 1 |
| note | String? | |
| createdAt / updatedAt | DateTime | |

Unique on `(routineId, date)` — one log per routine per day. Indexed on `date`.

See `prisma/schema.prisma` for the source of truth. No schema changes were
needed for either consolidation (merging the apps, then flattening the
monorepo) — `User`/`Routine`/`DailyLog` are unchanged from the original design.

## Server Components vs. Route Handlers

There is no separate API server any more, but there's still an API
**surface** — `app/api/**` — because Client Components (things the browser
runs, like clicking a checkbox) still need somewhere to send a mutation.
Server Components don't: they run server-side already, so they skip HTTP
entirely and call the business logic in `lib/server/*.ts` directly.

- **`lib/server/*.ts`** (`routines.ts`, `checkins.ts`, `analytics.ts`,
  `admin.ts`, `auth.ts`) — plain async functions operating on `prisma`
  directly (no framework, no DI — this replaces the old NestJS services).
  Called by Server Components (pages) for **reads**, and by Route Handlers
  for both reads and writes.
- **`app/api/**/route.ts`** — thin HTTP wrappers: read the session
  (`lib/auth.ts`'s `getSession()`), validate the body with `zod`
  (`lib/validation.ts`), call the matching `lib/server/*` function, return
  `NextResponse.json(...)`. Only endpoints an actual Client Component calls
  exist: register/login/logout/me, create/update/delete routine, upsert
  check-in. **There are no GET routines/checkins/admin Route Handlers** —
  nothing client-side needs them, since the pages that show that data are
  Server Components reading straight from `lib/server/*`.
- **`lib/auth.ts`** — JWT sign/verify (via `jose`) + the httpOnly cookie
  (`getSession()`, `setSessionCookie()`, `clearSessionCookie()`). Replaces
  the old `JwtAuthGuard`/`RolesGuard` — there's no global guard now; each
  page does `const session = await getSession(); if (!session) redirect(...)`
  and each Route Handler does the same, returning 401/403 JSON instead of
  redirecting.

**A subtlety this created**: `lib/server/*` functions called from Server
Components return real `Date` objects (Prisma's native shape); the same
data returned from a Route Handler as `NextResponse.json(...)` gets
JSON-serialized (dates become ISO strings) automatically. `lib/types/`'s
types (`Routine`, `User`, `AdminUserSummary`, …) are the **JSON wire-format
contract** (`createdAt: string`), so `lib/server/*` explicitly
`.toISOString()`s dates before returning — otherwise a Server Component
passing a `Routine` as a prop to a Client Component would hand it a `Date`
(RSC preserves `Date` across the server/client boundary fine at runtime,
it's the TypeScript contract that would drift). Look at
`lib/server/routines.ts`'s `serializeRoutine` for the pattern if adding a
new server-side read.

### Auth (`/api/auth`)
- `POST /api/auth/register` — `{ email, password, name? }` → creates the
  user (first ever registration becomes `ADMIN`), sets the auth cookie,
  returns the user (no `passwordHash`)
- `POST /api/auth/login` — `{ email, password }` → sets the auth cookie,
  returns the user
- `POST /api/auth/logout` — clears the cookie
- `GET /api/auth/me` — the current user, or 401 if not signed in (kept for
  parity/future client-side use; nothing currently calls it — `layout.tsx`
  gets the user server-side instead)

### Routines (`/api/routines`) — scoped to the signed-in user
- `POST /api/routines` — create — `userId` is set from the session, not the body
- `PATCH /api/routines/:id` — update
- `DELETE /api/routines/:id` — delete (cascades check-ins)
- Reads: `lib/server/routines.ts`'s `listRoutines()`, called directly by
  the Today/Settings Server Components — no `GET` Route Handler exists

Cross-user access (updating/deleting someone else's routine) returns 404,
not 403 — avoids confirming another user's routine id exists.

### Check-ins (`/api/checkins`) — scoped via routine ownership
- `POST /api/checkins` — upsert (idempotent create-or-update for a routine+date)
- `DELETE /api/checkins?routineId=&date=` — remove one check-in

### Analytics & Admin — no Route Handlers at all
Both are read-only and only ever shown via Server Components
(`(app)/analytics/page.tsx`, `(admin)/admin/page.tsx`), so they call
`lib/server/analytics.ts` / `lib/server/admin.ts` directly — there's
nothing for a Client Component to call, so there's no `/api/analytics` or
`/api/admin` route at all. The admin page itself does the `ADMIN`-role
check (`redirect("/today")` if not) since there's no global guard to do it
centrally.

Shared response/request shapes live in `lib/types/` (`User`, `Routine`,
`CheckIn`, `DailySummary`, `PeriodSummary`, `RoutineStreak`,
`AdminUserSummary`, `AdminRoutineSummary`, …).

## Testing

**Playwright** (root `playwright.config.ts`, tests in `e2e/tests/`) — was not
in the original spec; added during foundation setup per project convention of
covering real user flows end-to-end rather than only unit-testing pieces.
`playwright.config.ts` starts just the one `npm run dev` now (was two
`webServer` entries, one per app, before the merge).

- `npm run test:e2e` — runs the suite (`reuseExistingServer` in local dev)
- `npm run test:e2e:ui` — Playwright UI mode
- Run `npx playwright install` once to fetch browser binaries
- Current coverage: register/login/logout + wrong-password rejection, the
  logged-out → `/login` redirect, navigation between Today/Analytics/Settings,
  and the create-routine → check-in-today flow (`e2e/tests/`, using a
  `registerAndLogin()` helper that signs up a fresh throwaway user per test)
- Not covered by e2e yet: the admin panel (the "first user becomes ADMIN"
  bootstrap is a one-time, order-dependent thing — the real admin account
  already exists in the dev DB from manual testing, so a test run can't
  reliably get an ADMIN session by just registering; would need a seeded
  test-only admin instead)

## Design Workflow

Not in the original spec — added because the app has no design system beyond
"shadcn/ui + Radix" listed as dependencies, with no process for how new
screens get designed. Convention going forward: **before implementing a new
or significantly-changed screen**, do a design pass first (Claude Code's
`design` skill — mockup as artboards, iterate visually) rather than jumping
straight to JSX. Every screen built so far (Today, Analytics, Settings,
Login, Register, Admin) is functional-but-plain scaffolding, not the result
of a design pass — treat them as a first draft to revisit through that
workflow, not as the intended final UI.

## Docker

Went through four iterations, each an explicit follow-up request: (1) added
after the foundation pass; (2) simplified to one shared dev image when the
project still had two apps; (3) collapsed to a single `apps/web/Dockerfile`
once the apps merged into one; (4) collapsed again to a repo-root
`Dockerfile` once `apps/web` itself moved up to the repo root (ADR-007).
Key points worth knowing before touching any of this:

- **One `Dockerfile` at the repo root** — `dev` target (used by
  `docker-compose.yml`, source bind-mounted for hot reload) and `runtime`
  target (production — `next.config.ts`'s `output: "standalone"`, reached
  via `--target runtime`). Build context is the repo root itself (no
  monorepo nesting to account for any more): `docker build --target runtime .`
- **No stage installs from the committed `package-lock.json`.** That
  lockfile is generated on macOS and only carries resolution metadata for
  macOS-native optional deps (`@tailwindcss/oxide-darwin-arm64`, etc.) —
  installing from it on Linux hits a known npm bug
  ([npm/cli#4828](https://github.com/npm/cli/issues/4828)) where the Linux
  native binaries (Tailwind's oxide engine, `@next/swc`, …) never get pulled
  in, even by plain `npm install`. Every image resolves fresh from
  `package.json` instead (still bounded by its semver ranges). This is
  independent of the monorepo-vs-flat question — still applies.
- **Prisma's native query engine and `next.config.ts`'s
  `output: "standalone"` need extra help to work together**: Prisma's
  engine binary is loaded dynamically at runtime, not via a static
  `import`/`require`, so Next's output-file-tracing (which only follows
  static imports) can miss it. Handled two ways, belt-and-suspenders:
  `next.config.ts`'s `outputFileTracingIncludes` force-includes
  `node_modules/.prisma/client/**/*` for every route, **and** the
  Dockerfile's `runtime` stage explicitly `COPY`s
  `node_modules/.prisma`/`node_modules/@prisma/client` into the standalone
  output on top of that. Verified by actually running the built `runtime`
  image standalone (not bind-mounted, real conditions) against the shared
  DB — it works.
- The production build now traces the server straight to `server.js` at the
  standalone output's own root (no more nested `apps/web/server.js` — that
  nesting was purely an artifact of the old `outputFileTracingRoot`
  pointing at a monorepo root above the app; there's no monorepo root above
  it any more, so no nesting) — the Dockerfile's `COPY` paths were
  simplified to match.
- **The `dev` target re-runs `prisma generate` on every container start**
  (its `CMD` does `npm run db:generate && npm run dev`) — the Prisma client
  lives in node_modules, which is a container-only volume in dev, so it
  never carries over from a host-side `npm run db:generate`. (There's also
  a `postinstall: prisma generate` script now — see ADR-007 — so this is
  belt-and-suspenders against a stale volume, not the only thing generating
  the client.)
- **One node_modules volume now, not two** — `docker-compose.yml` used to
  need a second volume for `apps/web/node_modules` specifically (npm
  workspaces left some platform-specific optional deps there, un-hoisted);
  with one `package.json` at the repo root there's nothing to un-hoist into,
  so one `node_modules:/repo/node_modules` volume covers everything.
- **Stale `.next/` cache**: `.next/` is bind-mounted from the host (only
  `node_modules` is volume-overridden), so a build error from a bad
  dependency state can persist across `docker compose down`/`up` until you
  `rm -rf .next` — bit us during setup, worth knowing.
- Both the `dev` compose stack and the production `runtime` image (run
  standalone, not just via compose) were smoke-tested against the real
  shared DB after every restructuring — not just built and assumed working.

## Completed Features

- [x] Project initialization
- [x] Database schema (User, Routine, DailyLog — see above)
- [x] Prisma setup (schema, client, migrations applied to shared Postgres)
- [x] Routine CRUD (Route Handlers + minimal Settings UI)
- [x] Daily check-ins (Route Handlers + minimal Today UI)
- [x] Analytics (daily/weekly/monthly summary + completion chart)
- [x] Streaks (current + longest, per routine)
- [x] Auth & multi-user — email/password (JWT in an httpOnly cookie), ADMIN/USER roles (first registrant becomes ADMIN), every Routine/DailyLog/analytics query scoped to its owner, an admin panel (`/admin`, `ADMIN`-only) listing every user and routine
- [x] Docker — dev (`docker-compose.yml`) and production (`Dockerfile` `runtime` target) images, built and smoke-tested
- [x] **Merged the two apps into one** — dropped the separate NestJS API in favor of Next.js Route Handlers; resolves the earlier open API-deployment question (see ADR-004/ADR-006)
- [x] **Flattened the monorepo** — no more `apps/`/`packages/`/workspaces; one `package.json`, one `node_modules`, at the repo root (see ADR-007)
- [x] Light/dark theme (`next-themes`) with a custom warm terracotta/amber
      brand palette (not the shadcn default grayscale) — CVD-validated
      categorical colors for charts, contrast-checked against real rendered
      pixels rather than assumed
- [x] Daily/weekly/monthly/yearly analytics — period tabs (Today/Week/Month/
      Year) on top of what was previously a fixed "last 7 days" view; Year
      rolls up into 12 monthly buckets rather than 365 daily bars
- [x] Admin panel overhaul — sidebar (Users / Routines / Analytics /
      Settings) replacing the single stacked page; search + server-side
      pagination on Users and Routines; per-user report drill-down
      (`/admin/users/[id]`, reuses the same period-tabbed analytics report);
      admin can edit another user's name/email/role (with a server-side
      guard against self-demotion); aggregate cross-user Analytics tab
      (same report component, no `userId` = aggregate mode, swaps streak
      tiles for Total users/Active routines since streaks have no owner
      attribution in aggregate)
- [x] Admin Settings — site-wide config (`AppSettings` singleton row: site
      name shown in the nav + browser tab, an "allow new registrations"
      toggle enforced in `registerUser()`) plus self-service profile/password
      update (`PATCH /api/auth/me`, requires current password to change it)
- [x] **Deployed to production** — Vercel (`https://daily-routine-six-alpha.vercel.app`)
      backed by Prisma Postgres (Accelerate). `lib/db.ts` detects the
      `prisma://`/`prisma+postgres://` URL scheme at runtime and only
      applies the Accelerate client extension then, so local dev keeps using
      the shared Docker Postgres unchanged; `schema.prisma` gained a
      `directUrl` (Prisma Postgres's Accelerate URL can't run migrations —
      `directUrl` is what `migrate deploy` actually uses). Migrations applied
      and a full register → login → session round-trip verified against the
      live deployment.
- [x] Email — password reset (`/forgot-password`, `/reset-password`),
      welcome email on registration, and a daily summary email via Vercel
      Cron, all through `lib/server/email.ts` (Resend; a no-op logger until
      `RESEND_API_KEY` is set — see Next Tasks)
- [x] Layout pass — widened the app's max content width (768px → 1024px;
      auth pages stay narrow via their own card width, unaffected), a
      shared `EmptyState` component (icon + title + description + CTA)
      replacing the plain "no routines yet" text boxes on Today/Settings,
      and a site-wide footer (developer credit)
- [x] SEO — full `<head>` metadata (Open Graph, Twitter card, `metadataBase`,
      per-page `<title>`s via a template), `robots.txt`/`sitemap.xml`
      (file-based, only the truly-public pages — everything else requires
      auth so is disallowed rather than wasting crawl budget on redirects),
      `theme-color` viewport meta for both themes
- [x] Favicon — code-generated (`app/icon.tsx`/`apple-icon.tsx` via
      `next/og`'s `ImageResponse`, no external image tool needed): a
      checkmark on the brand terracotta, replacing the default Next.js icon
- [ ] UI — still a functional scaffold beyond the layout pass above; a real
      design pass (see Design Workflow) is unstarted

## Current Milestone

Phase 1 — Core app + admin tooling: **complete and live in production.**

## Next Tasks — Phase 2 (growth & monetization)

- [x] Password reset flow — `/forgot-password` + `/reset-password`,
      single-use hashed tokens (`PasswordResetToken`, 1h expiry), no email
      enumeration (same response either way)
- [x] Welcome email on registration
- [x] Daily summary email — Vercel Cron (`vercel.json`, 8am UTC) hits
      `/api/cron/daily-summary`, `Authorization: Bearer $CRON_SECRET`-gated
- [ ] Razorpay payment integration — explicitly deferred, doing this later
- [ ] Subscription-based plans — gate features/limits by plan, driven by the
      Razorpay integration above; also deferred with it

All three shipped items go through `lib/server/email.ts` (Resend). Not yet
wired to a real Resend API key/domain — `RESEND_API_KEY` unset just logs
and skips instead of sending, verified that way (register/forgot-password/
reset-password/cron all exercised end-to-end against the real dev DB, cron
processed all 50 seeded users with 0 errors). Set `RESEND_API_KEY` (and
ideally `EMAIL_FROM` on a verified domain) to actually send.

Carried over from Phase 1, still not done:

1. Run a design pass (via the `design` skill) for Today / Analytics /
   Settings / Login / Register / Admin and rebuild the UI from that
2. Expand Playwright coverage (analytics assertions, routine edit/delete,
   weekly/monthly/yearly views, admin panel via a seeded test admin, and now
   password reset)
3. Add unit tests for `lib/server/analytics.ts`'s streak/due-day logic (it
   has subtle UTC-boundary edge cases — see the bugs fixed during setup,
   below) and for the ownership checks in `lib/server/routines.ts`/`checkins.ts`
4. Consider a Next.js `middleware.ts` for auth if the per-page `redirect()`
   boilerplate gets old as more protected routes get added

## Architectural Decisions

### ADR-001 — PostgreSQL
Decision: PostgreSQL + Prisma.

Reason: Relational data (Routine ↔ DailyLog) with real query needs for
analytics aggregation; Prisma gives type-safe access and migrations.

### ADR-002 — Monorepo *(fully superseded — see ADR-006, ADR-007)*
Original decision: npm workspaces monorepo (`apps/*`, `packages/*`), two
apps (web + api), no extra build tool (Turborepo/Nx).

Status: neither the two-apps part (ADR-006) nor the workspaces/packages
part (ADR-007) stuck. This is a single flat project now — no `apps/`,
`packages/`, or workspaces at all. Kept here for history only.

### ADR-003 — Shared database instead of a project-local one
Decision: Connect to the shared `../database` docker-compose Postgres over
the external `db-network`, using a dedicated `daily_routine` schema, instead
of defining a Postgres service in this project.

Reason: Established cross-project convention (see `../database/skills.md` and
the `shared-database-network` memory) — avoids running N copies of Postgres
locally across projects.

### ADR-004 — API deployment target *(superseded by ADR-006)*
Original decision: a production Dockerfile for the (then-separate) NestJS
API, deployable to any Docker host.

Status: moot — there's no separate API to deploy any more (see ADR-006).
Kept here for history; don't follow its guidance.

### ADR-005 — Auth: email/password + JWT cookie, first-user-becomes-admin
Decision: Email/password auth (bcrypt-hashed), a JWT in an `httpOnly` cookie
(not `localStorage`/a bearer token the frontend manages) as the session, and
no separate admin-invite flow — the first account ever registered
automatically becomes `ADMIN`.

Reason: This is a small, self-hosted app with one deploy, not a
multi-tenant SaaS — OAuth would add external app registration/redirect-URI
config for no real benefit here, and a plain email/password flow is
simplest to reason about and test. An httpOnly cookie means the JWT is
never reachable from JS (XSS-safer than `localStorage`). First-user-becomes-
admin avoids a separate seed script or environment variable for
bootstrapping the one admin account. Unaffected by the later merge — `jose`
replaced `@nestjs/jwt` for signing/verifying the same JWT shape, and an
already-issued cookie kept working across the migration (verified).

### ADR-006 — Merge the NestJS API into the Next.js app
Decision: Drop `apps/api` (NestJS) entirely. All backend logic moved into
`apps/web`: business logic in `lib/server/*.ts` (called directly by Server
Components), a thin HTTP layer in `app/api/**` Route Handlers (called by
Client Components), auth via `lib/auth.ts` (JWT in a cookie, verified with
`jose`) instead of NestJS guards. Also reorganized `apps/web` internally
(route groups + matching component folders) to keep admin/frontend/auth
concerns visually separate now that they all live in one app — see
"Architecture" above.

Reason: Explicit request. The two-app split was carrying real operational
cost (CORS, two dev servers, a client/server API-fetch split driven by
Docker networking, two Dockerfiles, ADR-004's unresolved "where does the API
deploy" question) for a single-deployment app that didn't need NestJS's
larger-team/larger-API conveniences (DI, decorators, module boundaries).
One Next.js app removes all of that: same-origin fetch (no CORS), reads skip
HTTP entirely (Server Components call `lib/server/*` directly), and
deployment is just "deploy a Next.js app" — Vercel-native, or the one
remaining Dockerfile.

Trade-offs accepted: lost NestJS's structure (DI, guards-as-a-composable-
concept, decorator-driven metadata) in exchange for plain functions and
per-page/per-handler checks; lost a hard process boundary between "frontend"
and "backend" (a bug in either can now, in principle, affect the same
process) — acceptable for this app's size and single-deployment shape.

### ADR-007 — Flatten the monorepo: apps/web + packages/* → repo root
Decision: Move `apps/web`'s entire contents up to the repo root; fold
`packages/database`'s Prisma schema into root `prisma/` and its client
wrapper into `lib/db.ts`; fold `packages/shared`'s types into `lib/types/`.
Delete `apps/`, `packages/`, and the root `workspaces` field. One
`package.json`, one `node_modules`, at the repo root.

Reason: Explicit request, driven by a concrete symptom — npm workspaces
hoists most dependencies to the workspace root but leaves a few
platform-specific optional ones (e.g. Tailwind's native binary) in the
individual app's own `node_modules`, so `apps/web` had **two**
`node_modules` directories even after ADR-006 reduced it to one app. That
split is structural to npm workspaces with multiple `package.json` files —
not fixable by reconfiguring hoisting — so removing it meant removing the
extra `package.json` files, i.e. removing the workspace itself. With one
`package.json`, npm has nothing left to leave un-hoisted.

Knock-on simplifications this enabled, beyond just the `node_modules`
question: `next.config.ts` no longer needs `outputFileTracingRoot` or a
manual `dotenv` load (the repo root **is** Next's project root now, so
`.env` auto-loads and file tracing needs no monorepo awareness); the
Dockerfile's `COPY` paths lost a directory level (`server.js` lands at the
standalone output's own root, not nested under `apps/web/`);
`docker-compose.yml` dropped from two node_modules volumes to one;
`vercel.json` dropped to just `{"framework": "nextjs"}` (no more
workspace-aware `buildCommand`/`outputDirectory`); added a root
`postinstall: prisma generate` script (previously `packages/database` had
its own `build` script doing this, no longer applicable with no separate
package).

Trade-off accepted: `packages/database`/`packages/shared` could no longer
be independently versioned or reused by a hypothetical second app in this
repo without re-extracting them — a non-issue while this repo holds exactly
one app, worth reconsidering only if that changes.

### ADR-008 — Production database: Prisma Postgres (via Vercel), Docker Postgres stays for local dev
Decision: Production (`https://daily-routine-six-alpha.vercel.app`) uses
Prisma Postgres, provisioned from Vercel's Storage tab (Accelerate-backed).
Local dev is unchanged — still the shared Docker Postgres in `../database`.

Reason: The shared local Postgres (ADR-003) is only reachable from the
developer's machine/Docker network, not from Vercel's serverless functions.
Needed *some* publicly reachable Postgres for production; Prisma Postgres
was the one-click option already integrated into the Vercel project.

Mechanics this required: `schema.prisma`'s datasource gained a `directUrl`
— Prisma Postgres's primary `DATABASE_URL` is a `prisma+postgres://`
Accelerate proxy URL that `prisma migrate`/`db push` can't run against
directly, so `directUrl` (Prisma CLI uses it automatically over `url` for
those commands) points at the real Postgres connection instead. `lib/db.ts`
checks `DATABASE_URL`'s scheme at runtime and only applies
`@prisma/extension-accelerate`'s `.withAccelerate()` for an actual
`prisma(+postgres)://` URL, so the same code path serves both a Docker
Postgres connection (dev) and an Accelerate one (prod) — the extended
client is cast back to `PrismaClient` on export, since typing it as the
true union of both branches makes TypeScript refuse to call any model
method through it ("signatures ... not compatible with each other").

Rollout snag worth remembering: Vercel auto-prefixes injected Storage env
vars (`dr_DATABASE_URL`, `dr_PRISMA_DATABASE_URL`, `dr_POSTGRES_URL`) when
an env var of that name already exists in the project — which it did here,
left over from an earlier manual `DATABASE_URL` pointing at
`localhost:5432`. The app kept reading that stale local value (crashing
every request with "Can't reach database server at localhost:5432") through
several redeploys, because *editing* `DATABASE_URL`'s value is a separate
step from adding the new `dr_`-prefixed ones — Vercel's env var list doesn't
make it obvious that a variable's value, not just its existence, needs
updating, and its "Added Xh ago" timestamp doesn't change on an edit
(only "Updated" does, easy to miss). Fixed by explicitly clearing and
replacing `DATABASE_URL`'s value with `dr_PRISMA_DATABASE_URL`'s, adding a
new `DIRECT_URL` set to `dr_POSTGRES_URL`'s value, then redeploying.
Verified via `prisma migrate deploy` against the direct connection and a
live register → login → session round-trip against the deployed app.

Trade-off accepted: `POSTGRES_PASSWORD` (docker-compose-only) has no
purpose on Vercel — left unset there rather than treated as required.

## Change Log

### 2026-09-13
- Created initial project architecture
- Established CONTEXT.md as persistent project context
- **Foundation milestone completed**: scaffolded the full monorepo per
  PROJECT_SPEC.md (apps/web via create-next-app, apps/api via Nest CLI,
  packages/database with Prisma schema + migration applied to the shared
  Postgres instance, packages/shared types), wired shadcn/ui + Radix + Lucide
  + Framer Motion + Recharts into apps/web, implemented Routine/Checkin/
  Analytics modules in apps/api, built minimal Today/Analytics/Settings
  screens, added Playwright e2e testing and a Design Workflow section
  (both missing from the original spec)
- Found and fixed two UTC-boundary bugs in the streak/due-day analytics
  logic during smoke-testing (routine created "today" wasn't counted as due
  today; streak walk-back used local midnight against UTC-stored dates,
  breaking for timezones ahead of UTC)
- Filled in previously-empty Database Schema, API, and ADR sections
- **Docker added** (explicit follow-up request): Dockerfiles (dev + runtime
  targets) for both apps, root `docker-compose.yml` for local dev over the
  shared `db-network`. Found and fixed a real cross-platform npm bug during
  setup (macOS-generated lockfile missing Linux native-binary resolution —
  npm/cli#4828) and a stale-Turbopack-cache footgun; both runtime images were
  built and smoke-tested standalone against the real API/DB, not just
  the dev target.
- **Auth + multi-user + admin panel added** (explicit follow-up request):
  `User` model + `Role` (USER/ADMIN), email/password login via a JWT in an
  httpOnly cookie (see ADR-005), every Routine/Checkin/Analytics query
  scoped to its owner (cross-user access returns 404, not 403), an `/admin`
  panel (`ADMIN`-only) listing every user and routine. Verified end-to-end
  via curl (register/login/logout, cross-user 404s, admin-only 403s, admin
  visibility) and via Playwright before calling it done.
- **Docker dev setup simplified** (explicit follow-up request, while there
  were still two apps): one shared `Dockerfile.dev` + one shared install
  used by both compose services, instead of each app having its own.
- **Merged apps/web and apps/api into one Next.js app** (explicit follow-up
  request — see ADR-006): dropped NestJS; ported all business logic to
  `lib/server/*.ts`; replaced NestJS guards with `lib/auth.ts` (`jose`) +
  per-page/per-handler checks; replaced `class-validator` DTOs with `zod`
  schemas (`lib/validation.ts`); reorganized `apps/web` into route groups
  `(admin)`/`(app)`/`(auth)` + matching `components/admin`/`components/frontend`
  folders; collapsed Docker back down to one `apps/web/Dockerfile` (dev +
  runtime targets) and one compose service. Fixed a real pre-existing bug
  surfaced by the merge along the way: `packages/database` was building
  clean only by accident, relying on `@types/node` hoisted in from the
  since-deleted `apps/api` rather than declaring its own dependency — gave
  it its own. Also discovered Next.js doesn't auto-load `.env` from a
  monorepo root (only its own project root), unlike NestJS's `ConfigModule`
  which did — fixed via an explicit `dotenv` load in `next.config.ts`.
  Verified end-to-end after the merge: full register/login/today/settings/
  analytics/admin flow, cross-user 404 isolation, and non-admin `/admin`
  redirect, all via curl against the dev server, the Docker dev stack, AND
  a standalone run of the production image (not just one of the three);
  confirmed a JWT issued by the old NestJS/`@nestjs/jwt` session was still
  valid under the new `jose`-based verification (same secret, same shape);
  full Playwright suite re-run and passing.

### 2026-09-14
- **Flattened the monorepo** (explicit follow-up request — see ADR-007):
  moved `apps/web`'s entire contents to the repo root; folded
  `packages/database`'s Prisma schema into root `prisma/` and its client
  wrapper into `lib/db.ts`; folded `packages/shared`'s types into
  `lib/types/`; deleted `apps/`, `packages/`, and the root `workspaces`
  field; merged the three `package.json` files into one. Result: exactly
  one `node_modules`, at the repo root (there used to be two — root +
  `apps/web` — even after the previous merge, since npm workspaces always
  leaves a few platform-specific optional deps un-hoisted in the leaf
  package as long as more than one `package.json` exists).
  `next.config.ts` lost its monorepo-specific `outputFileTracingRoot` and a
  manual `dotenv` load (the repo root is Next's own project root now, so
  `.env` and file tracing both work with zero config); the Dockerfile and
  `docker-compose.yml` simplified accordingly (one node_modules volume, one
  path level less throughout); `vercel.json` reduced to
  `{"framework": "nextjs"}`; added a root `postinstall: prisma generate`.
  Verified end-to-end after flattening — not just built: full monorepo
  build + lint clean, full Playwright suite passing, register/login/today/
  settings/analytics/admin flow confirmed via curl against the dev server,
  the Docker dev stack, AND a standalone run of the freshly-rebuilt
  production image (server.js now at the standalone output's own root, not
  nested).
- **Light/dark theme** (explicit follow-up request, twice — first pass used
  a generic blue brand color, second pass replaced it with a warmer
  terracotta/amber more fitting a habit-streak app): wired up `next-themes`
  (it was an unused dependency — nothing rendered the provider or a toggle
  before this), replaced shadcn's default all-grayscale token set with a
  real color combination in both light and dark, chart colors taken from
  the `dataviz` skill's CVD-validated categorical palette. Contrast wasn't
  assumed — checked via canvas-rendered pixel values (`getComputedStyle`
  doesn't resolve `oklch()` to sRGB in this Chromium version) and by
  screenshotting both themes.
- **Daily/weekly/monthly/yearly analytics** (explicit follow-up request):
  generalized the old fixed "last 7 days" analytics page into period tabs;
  Year aggregates into 12 monthly buckets rather than 365 daily bars, capped
  at today so an in-progress year's remaining months don't count as "due
  and never completed" and drag its rate down (a real bug caught before
  shipping, not after).
- **Admin panel overhaul** (explicit follow-up request, in stages — first a
  sidebar, then "also add search/pagination/analytics/settings"): sidebar
  navigation (Users/Routines/Analytics/Settings) replacing the single
  stacked page, with the admin-only auth guard centralized into a shared
  layout instead of repeated per-page; search + server-side pagination on
  Users/Routines; a per-user report drill-down reusing the same
  period-tabbed analytics component generalized to also run in an
  aggregate, no-single-owner mode for the admin's own cross-user Analytics
  tab; admin editing of another user's name/email/role, with a server-side
  (not just UI-disabled) guard against self-demotion; an `AppSettings`
  singleton table (new migration) for site name + a registration-open
  toggle actually enforced in `registerUser()`, plus self-service
  profile/password change requiring the current password. Verified against
  the real dev database throughout — registered/logged-in test accounts,
  hit the API guards directly with curl bypassing the UI (403 for
  non-admins, 400 for self-demotion, 409 for a duplicate email), not just
  clicked through the browser.
- Added a `git remote` and made the initial commit (not pushed, per
  request) — `.claude/scheduled_tasks.lock` (runtime session state, not
  project config) added to `.gitignore` first so it wasn't swept in.
- **Deployed to production** (see ADR-008): Prisma Postgres via Vercel
  Storage, `directUrl` added to `schema.prisma`, `lib/db.ts` made
  environment-aware (Accelerate extension only for an actual
  `prisma(+postgres)://` connection). Debugged a real rollout issue live
  (stale `DATABASE_URL` surviving multiple redeploys because only its
  *existence* was checked, not its value — see ADR-008) down to the actual
  Vercel runtime log line, not just guessing from symptoms.
- Marked this the end of **Phase 1**; recorded Phase 2 (password reset,
  welcome/daily email, Razorpay, subscriptions) in Next Tasks per explicit
  request.
- **Phase 2, minus payments** (explicit follow-up request — Razorpay/
  subscriptions deliberately deferred): password reset (`PasswordResetToken`
  model — new migration, single-use, SHA-256-hashed, 1h expiry, no email
  enumeration), welcome email on registration, and a daily summary email
  via Vercel Cron, all through a new `lib/server/email.ts` (Resend, chosen
  over SMTP/SendGrid/etc. per explicit request) that logs-and-skips rather
  than throwing when `RESEND_API_KEY` is unset — registration/reset flows
  can't be broken by an email provider outage or a missing key. Verified
  against the real dev DB, not just typechecked: the full request → reset →
  redeem round-trip via curl (including a reused-token rejection and a
  garbage-token rejection, both via the real API, not asserted from
  reading the code), and the cron endpoint against all 50 seeded users
  (0 errors). Confirmed `next build` doesn't choke on the new
  `useSearchParams()` usage in the reset-password page (wrapped in
  `Suspense`, as the framework requires).
- **Layout review + SEO + footer + favicon** (explicit follow-up request;
  the `frontend-design` subagent still isn't loaded in this session — needs
  a restart to register — so did the review directly instead, same
  standard): screenshotted every main screen first rather than guessing,
  which found one real, consistent problem — every page capped at a 768px
  column, leaving most of a normal desktop viewport empty — not a spacing
  or component issue, those were already fine. Widened to 1024px (root
  `<main>` + `Nav`'s inner width only; auth pages keep their own narrow
  card, untouched); replaced the plain empty-state text boxes on Today/
  Settings with a shared `EmptyState` component (icon, title, description,
  CTA); added a site-wide footer with a developer credit link. SEO: full
  metadata (`metadataBase`, Open Graph, Twitter card, per-page `<title>`
  via a template — added to every page), file-based `robots.txt`/
  `sitemap.xml` (only `/login`/`/register` are public; everything else
  requires auth so is disallowed rather than wasting crawl budget), and
  `theme-color` for both themes. Favicon replaced with a code-generated
  one (`next/og`'s `ImageResponse` — no image-editing tool needed): a
  checkmark on the brand terracotta. Verified with a full `next build`
  (confirmed `/icon`, `/apple-icon`, `/robots.txt`, `/sitemap.xml` all
  present in the route list), the full Playwright suite, and real
  screenshots of the before/after — not just code review.

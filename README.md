# Daily Routine & Habit Tracker

A daily routine and habit tracker with multi-user accounts (email/password,
Admin/User roles): routine management, daily check-ins, streaks, and
daily/weekly/monthly/yearly analytics — both for yourself and, if you're an
admin, aggregated across every user. Password reset and welcome/daily-summary
email are built in (see [Email](#email)). **Phase 1 (core app + admin
tooling) is complete and live in production** — see
[docs/CONTEXT.md](./docs/CONTEXT.md)'s Project Status for what Phase 2 covers
(payments/subscriptions, not built yet).

One Next.js app — frontend and API (Route Handlers) together, no separate
backend, no monorepo — a single `package.json` and `node_modules` at the
repo root. See [docs/CONTEXT.md](./docs/CONTEXT.md) for full project context,
schema, API, auth, and architectural decisions (including ADRs and a full
changelog), and [docs/PROJECT_SPEC.md](./docs/PROJECT_SPEC.md) for the
directory layout.

## Stack

Next.js (App Router) + Tailwind CSS + shadcn/ui + Radix UI + Lucide +
Framer Motion + Recharts, with Prisma (PostgreSQL — Prisma Postgres/
Accelerate in production, a plain shared Postgres locally), JWT (httpOnly
cookie) auth + role-based access, `next-themes` (light/dark), Resend for
email, and Playwright e2e tests (`e2e/`) — all in this one project.

## Prerequisites

- Node.js 20+
- The shared local Postgres instance from [`../database`](../database) running
  (`cd ../database && docker compose up -d`) and reachable on `db-network` —
  see [`../database/skills.md`](../database/skills.md) for connection details.
  This project does not run its own database container.

## Setup

```bash
npm install
cp .env.example .env
# fill DATABASE_URL + DIRECT_URL + POSTGRES_PASSWORD from ../database/skills.md
# (DIRECT_URL is just a copy of DATABASE_URL locally — see the comment in
# .env.example), and generate a JWT_SECRET:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run db:generate
npm run db:migrate
```

The **first account you register becomes ADMIN automatically** — no
separate seed step. Register once at `/register` to create it.

Email (welcome/password-reset/daily-summary) and the daily-summary cron are
optional locally — see [Email](#email) below; nothing breaks without them.

## Development

Either run directly on the host, or in Docker — both need the shared DB up
first: `cd ../database && docker compose up -d`.

**Host:**
```bash
npm run dev   # http://localhost:3000
```

**Docker** (source is bind-mounted for hot reload; see `docker-compose.yml`):
```bash
docker compose up          # same port as above
```
For production, the same `Dockerfile` has a `runtime` target instead —
`docker build --target runtime .`. Note: no stage installs from the
committed (macOS-generated) `package-lock.json` — see the comment in
`Dockerfile` for why.

## Email

`lib/server/email.ts` wraps [Resend](https://resend.com) for the welcome
email (on registration), password-reset links, and the daily summary email.
Without `RESEND_API_KEY` set, it logs and skips instead of sending — nothing
breaks, registration/reset/etc. all still work, you just won't get real
email. To actually send:

```bash
RESEND_API_KEY="re_..."   # resend.com
APP_URL="https://your-deployed-url"   # used to build links inside emails
# EMAIL_FROM="Your App <you@yourdomain.com>"   # once you verify a domain on Resend
```

The daily summary email is triggered by a Vercel Cron job (`vercel.json`,
16:30 UTC / 10pm IST — Vercel Cron always runs in UTC) hitting
`/api/cron/daily-summary`, authenticated via
`Authorization: Bearer $CRON_SECRET` — set `CRON_SECRET` in production (it's
optional locally; the route allows unauthenticated calls if unset, so you
can trigger it directly for testing).

## Deployment

Deployed on Vercel, backed by Prisma Postgres. See `docs/CONTEXT.md`'s
ADR-008 for the full setup (env var mapping, the `directUrl` migration
wrinkle, a real rollout issue and how it was diagnosed). In short:

- `DATABASE_URL` in production is a Prisma Postgres/Accelerate
  `prisma+postgres://` URL; `DIRECT_URL` is the real Postgres connection
  Prisma CLI needs for `prisma migrate deploy` (Accelerate can't run
  migrations). `lib/db.ts` detects the URL scheme at runtime and only wraps
  the client with `withAccelerate()` for an actual Accelerate URL, so this
  same code also runs against the plain local Postgres unchanged.
- Run `DATABASE_URL="<DIRECT_URL value>" npx prisma migrate deploy` against
  production after any new migration — Vercel doesn't run this for you.

## Testing

```bash
npm run test:e2e      # Playwright end-to-end tests (starts the dev server automatically)
npm run test:e2e:ui   # Playwright UI mode
```

Run `npx playwright install` once to download browser binaries. Tests sign
up a fresh throwaway user per test (`e2e/tests/helpers.ts`) rather than
sharing one account.

## Building UI screens

A layout/SEO/accessibility pass has been done (see `docs/CONTEXT.md`'s
changelog — widened content width, fixed a real routine-list layout bug,
mobile nav, empty states, metadata, favicon), but a full visual **design**
pass (via Claude Code's `design` skill — mockup as artboards, iterate
visually) is still outstanding for Today/Analytics/Settings/Login/Register/
Admin. Treat the current screens as functional and reasonably polished, not
as a finished design — see the "Design Workflow" section in
[docs/CONTEXT.md](./docs/CONTEXT.md) before a significant UI change.

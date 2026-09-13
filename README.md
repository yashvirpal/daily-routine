# Daily Routine & Habit Tracker

A daily routine and habit tracker with multi-user accounts (email/password,
Admin/User roles): routine management, daily check-ins, streaks, and
daily/weekly/monthly analytics.

One Next.js app — frontend and API (Route Handlers) together, no separate
backend, no monorepo — a single `package.json` and `node_modules` at the
repo root. See [docs/CONTEXT.md](./docs/CONTEXT.md) for full project context,
schema, API, auth, and architectural decisions, and
[docs/PROJECT_SPEC.md](./docs/PROJECT_SPEC.md) for the directory layout.

## Stack

Next.js (App Router) + Tailwind CSS + shadcn/ui + Radix UI + Lucide +
Framer Motion, with Prisma (PostgreSQL), JWT (httpOnly cookie) auth +
role-based access, and Playwright e2e tests (`e2e/`) — all in this one
project.

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
# fill DATABASE_URL + POSTGRES_PASSWORD from ../database/skills.md, and
# generate a JWT_SECRET:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run db:generate
npm run db:migrate
```

The **first account you register becomes ADMIN automatically** — no
separate seed step. Register once at `/register` to create it.

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

## Testing

```bash
npm run test:e2e      # Playwright end-to-end tests (starts the dev server automatically)
npm run test:e2e:ui   # Playwright UI mode
```

Run `npx playwright install` once to download browser binaries. Tests sign
up a fresh throwaway user per test (`e2e/tests/helpers.ts`) rather than
sharing one account.

## Building UI screens

New screens/components should start as a design pass (Claude's `design`
skill) before implementation — see the "Design Workflow" section in
[docs/CONTEXT.md](./docs/CONTEXT.md). This includes the login/register/admin screens
built so far, which are functional-but-plain scaffolding, not a finished design.

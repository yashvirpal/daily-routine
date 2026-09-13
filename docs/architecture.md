# Architecture

See [./CONTEXT.md](./CONTEXT.md) for the full write-up (schema, API,
testing, design workflow, ADRs). This file is a short pointer, not a
duplicate — keep CONTEXT.md as the source of truth and update it, not this
file, as the project evolves.

## At a glance

One flat Next.js project — frontend and "API" in the same process, one
`package.json`, one `node_modules`, no monorepo. (There used to be a
separate NestJS API, and before that also separate `packages/database`/
`packages/shared` workspace packages; both were merged in — see CONTEXT.md
ADR-006 and ADR-007.)

```
Browser
  │
  ├─ page navigation ──────────► Server Component ──► lib/server/* ──► Prisma (lib/db.ts) ──► Postgres (shared, ../database)
  │                                                        ▲
  └─ fetch (mutations only) ──► app/api/**/route.ts ───────┘
```

- Server Components (pages) read data by calling `lib/server/*` directly —
  no HTTP hop, since it's all one process and one codebase.
- Client Components (things the browser runs — clicking a checkbox, submitting
  a form) can't call `lib/server/*` directly, so they `fetch` a Route
  Handler under `app/api/**`, which does the same `lib/server/*` call plus
  auth/validation.
- `lib/types/` is the JSON wire-format contract (what a Route Handler
  returns) — which `lib/server/*` has to match even for Server-Component-only
  reads (see CONTEXT.md "Server Components vs. Route Handlers" for why
  that's not automatic).

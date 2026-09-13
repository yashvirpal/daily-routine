daily-routine/
├── README.md
├── .gitignore
├── .env.example
├── .env                            # gitignored — real values, see docs/CONTEXT.md
├── .dockerignore
├── docker-compose.yml               # local dev: one `web` service, shared db-network
├── package.json                    # single package.json for the whole project (no workspaces)
├── vercel.json                     # {"framework": "nextjs"} — zero-config otherwise
├── playwright.config.ts
├── Dockerfile                      # dev + runtime (standalone output) targets
├── next.config.ts                  # output: standalone, Prisma file-tracing include
├── tsconfig.json                   # "@/*" -> "./*"
│
├── prisma/
│   ├── schema.prisma               # User, Routine, DailyLog
│   └── migrations/
│
├── app/
│   ├── page.tsx                    # redirects to /today
│   ├── layout.tsx                  # fetches current user, passes to <Nav>
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                      # regular signed-in user pages
│   │   ├── today/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   ├── (admin)/
│   │   └── admin/page.tsx          # ADMIN-only, redirects otherwise
│   └── api/                        # Route Handlers — only what Client Components call
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── routines/
│       │   ├── route.ts            # POST create
│       │   └── [id]/route.ts       # PATCH, DELETE
│       └── checkins/route.ts       # POST upsert, DELETE
│
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── nav.tsx
│   ├── auth/                       # auth-form.tsx (shared login/register form)
│   ├── frontend/                   # regular user-facing components
│   │   ├── routines/               # routine-list.tsx
│   │   ├── checkins/               # routine-checkin-list.tsx
│   │   └── analytics/              # completion-chart.tsx, stat-tile.tsx
│   └── admin/                      # user-table.tsx, routine-table.tsx
│
├── lib/
│   ├── db.ts                       # Prisma singleton client (re-exports @prisma/client too)
│   ├── auth.ts                     # JWT sign/verify (jose) + cookie helpers + getSession()
│   ├── validation.ts               # zod schemas for Route Handler input
│   ├── types/                      # the JSON wire-format contract (what a Route Handler returns)
│   │   ├── user.ts                 # User, RegisterInput, LoginInput, AdminUserSummary
│   │   ├── routine.ts              # + AdminRoutineSummary
│   │   ├── checkin.ts
│   │   ├── analytics.ts
│   │   └── index.ts
│   ├── server/                     # business logic — called directly by Server Components
│   │   ├── auth.ts                 # register/login/getUserById
│   │   ├── routines.ts
│   │   ├── checkins.ts
│   │   ├── analytics.ts
│   │   └── admin.ts
│   ├── api.ts                      # client-side fetch client (Client Components only, hits /api/*)
│   └── utils.ts                    # shadcn cn() helper
│
├── public/
├── components.json                 # shadcn config
│
├── e2e/                             # Playwright e2e tests (added — see docs/CONTEXT.md Testing)
│   └── tests/
│       ├── helpers.ts               # registerAndLogin() — signs up a fresh throwaway user
│       ├── auth.spec.ts
│       ├── navigation.spec.ts
│       └── routine-checkin.spec.ts
│
└── docs/
    ├── CONTEXT.md
    ├── PROJECT_SPEC.md
    └── architecture.md

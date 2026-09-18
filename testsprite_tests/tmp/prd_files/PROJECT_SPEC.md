daily-routine/
├── README.md
├── .gitignore
├── .env.example
├── .env                            # gitignored — real values, see docs/CONTEXT.md
├── .dockerignore
├── docker-compose.yml               # local dev: one `web` service, shared db-network
├── package.json                    # single package.json for the whole project (no workspaces)
├── vercel.json                     # framework + the daily-summary cron schedule
├── playwright.config.ts
├── Dockerfile                      # dev + runtime (standalone output) targets
├── next.config.ts                  # output: standalone, Prisma file-tracing include
├── tsconfig.json                   # "@/*" -> "./*"
│
├── prisma/
│   ├── schema.prisma               # User, Routine, DailyLog, AppSettings, PasswordResetToken
│   └── migrations/
│
├── app/
│   ├── page.tsx                    # redirects to /today
│   ├── layout.tsx                  # session + site settings; sidebar (admin) vs header nav (user)
│   ├── globals.css                 # theme tokens (light/dark, warm terracotta brand)
│   ├── icon.tsx, apple-icon.tsx     # code-generated favicon (next/og ImageResponse)
│   ├── robots.ts, sitemap.ts        # file-based SEO — only /login, /register are public
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx  # reads ?token=, wrapped in Suspense
│   ├── (app)/                      # regular signed-in user pages
│   │   ├── today/page.tsx
│   │   ├── analytics/page.tsx      # Today/Week/Month/Year period tabs
│   │   └── settings/page.tsx       # profile update + routine management
│   ├── (admin)/admin/              # ADMIN-only (guarded in layout.tsx, not per-page)
│   │   ├── layout.tsx              # just the access guard — AppSidebar lives in root layout
│   │   ├── page.tsx                 # Users (search + pagination)
│   │   ├── routines/page.tsx        # Routines (search + pagination)
│   │   ├── analytics/page.tsx       # aggregate analytics, same period tabs, no userId
│   │   ├── settings/page.tsx        # site-wide config (AppSettings) + own profile
│   │   └── users/[id]/page.tsx      # one user's analytics report, admin's view
│   └── api/                        # Route Handlers — only what Client Components call
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── me/route.ts          # GET + PATCH (self-service profile/password)
│       │   ├── forgot-password/route.ts
│       │   └── reset-password/route.ts
│       ├── admin/
│       │   ├── users/[id]/route.ts  # PATCH — admin edits another user
│       │   └── settings/route.ts    # GET/PATCH — site-wide config
│       ├── routines/
│       │   ├── route.ts            # POST create
│       │   └── [id]/route.ts       # PATCH, DELETE
│       ├── checkins/route.ts       # POST upsert, DELETE
│       └── cron/daily-summary/route.ts  # Vercel Cron, CRON_SECRET-gated
│
├── components/
│   ├── ui/                         # shadcn/ui primitives + empty-state.tsx (shared empty-state UI)
│   ├── nav.tsx                     # header — full links for a USER, link-less for an ADMIN
│   ├── app-sidebar.tsx             # an ADMIN's whole nav (own pages + admin section), root layout
│   ├── site-footer.tsx
│   ├── theme-provider.tsx, theme-toggle.tsx
│   ├── auth/                       # auth-form.tsx (login/register) + forgot/reset-password forms
│   ├── account/                    # profile-settings-form.tsx — shared, used by both roles
│   ├── frontend/                   # regular user-facing components
│   │   ├── routines/               # routine-list.tsx
│   │   ├── checkins/               # routine-checkin-list.tsx
│   │   └── analytics/              # analytics-report.tsx (shared user/admin/aggregate),
│   │                                 completion-chart.tsx, period-tabs.tsx, stat-tile.tsx
│   └── admin/                      # user-table.tsx, routine-table.tsx, edit-user-dialog.tsx,
│                                     site-settings-form.tsx, table-search.tsx, table-pagination.tsx
│
├── lib/
│   ├── db.ts                       # Prisma singleton; Accelerate extension only for a
│   │                                 prisma(+postgres):// URL (prod), plain client otherwise (dev)
│   ├── auth.ts                     # JWT sign/verify (jose) + cookie helpers + getSession()
│   ├── validation.ts               # zod schemas for Route Handler input
│   ├── types/                      # the JSON wire-format contract (what a Route Handler returns)
│   │   ├── user.ts                 # User, RegisterInput, LoginInput, ForgotPassword/ResetPasswordInput,
│   │   │                             AdminUserSummary, UpdateUserInput
│   │   ├── routine.ts              # + AdminRoutineSummary
│   │   ├── checkin.ts
│   │   ├── analytics.ts            # + MonthlyBucket, YearlySummary
│   │   ├── settings.ts             # AppSettings, UpdateAppSettingsInput, UpdateSelfInput
│   │   ├── pagination.ts           # PageParams, PageResult<T>
│   │   └── index.ts
│   ├── server/                     # business logic — called directly by Server Components
│   │   ├── auth.ts                 # register/login/getUserById/updateSelf/password-reset
│   │   ├── routines.ts
│   │   ├── checkins.ts
│   │   ├── analytics.ts            # per-user + admin-aggregate variants of the same summaries
│   │   ├── admin.ts                # listAllUsers/Routines (paginated), updateUser
│   │   ├── app-settings.ts         # site-wide config, lazy-created singleton row
│   │   └── email.ts                # Resend wrapper — welcome/reset/daily-summary, no-ops if unconfigured
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
    ├── CONTEXT.md                  # source of truth — status, schema, API, ADRs, full changelog
    ├── PROJECT_SPEC.md             # this file
    └── architecture.md

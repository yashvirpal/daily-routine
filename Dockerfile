# Build context is the repo root:
#   docker build --target runtime -t daily-routine .
# (docker-compose.yml builds the *dev* target instead.)

FROM node:20-slim AS base
# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# ---- deps: install once, shared by the dev and build stages ----
FROM base AS deps
# No package-lock.json here, deliberately: it's generated on macOS and only
# resolves platform-native optional deps (e.g. @tailwindcss/oxide's native
# binding, @next/swc) for darwin-arm64. Installing from it on Linux hits a
# known npm bug (https://github.com/npm/cli/issues/4828) where those
# packages' Linux variants never get pulled in, even by plain `npm install`.
# Resolving fresh here (still bounded by package.json semver ranges) fixes
# it; versions may drift slightly from the host's committed lockfile.
COPY package.json ./
COPY prisma prisma
RUN npm install

# ---- dev: source is bind-mounted in by docker-compose; just watch ----
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
# The Prisma client is generated into node_modules, which lives in a
# container-only volume in dev — (re)generate it on every start rather than
# relying on what `npm install` produced at build time.
CMD ["sh", "-c", "npm run db:generate && npm run dev"]

# ---- build: `next build` (standalone output) ----
# (Prisma client was already generated in the `deps` layer via the
# `postinstall` script — `COPY . .` doesn't touch node_modules.)
FROM deps AS build
COPY . .
RUN npm run build

# ---- runtime: minimal production image (next.config.ts output: "standalone") ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/.next/standalone ./
COPY --from=build /repo/.next/static .next/static
COPY --from=build /repo/public public
# Belt-and-suspenders alongside next.config.ts's outputFileTracingIncludes:
# Prisma's native query engine is loaded dynamically, which output tracing
# can miss — make sure the generated client is definitely there.
COPY --from=build /repo/node_modules/.prisma node_modules/.prisma
COPY --from=build /repo/node_modules/@prisma/client node_modules/@prisma/client

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

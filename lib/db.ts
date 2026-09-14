import "server-only";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

export * from "@prisma/client";

function createClient(): PrismaClient {
  const client = new PrismaClient();
  // Prisma Postgres (production) connects through Accelerate's edge proxy —
  // recognizable by its "prisma://"/"prisma+postgres://" scheme. Local dev
  // (the shared Docker Postgres, see ../database) uses a plain
  // "postgresql://" URL and skips the extension — Accelerate's client
  // extension only works against an actual Accelerate connection.
  //
  // Cast back to PrismaClient: the extended client is a strict superset
  // (same delegate methods, plus an optional cacheStrategy arg this app
  // never uses) — typing it as the union of both branches' exact types
  // makes every model call across lib/server/* fail with "signatures ...
  // not compatible with each other", since TS won't call a method through
  // a union of differently-overloaded signatures.
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("prisma")
    ? (client.$extends(withAccelerate()) as unknown as PrismaClient)
    : client;
}

declare global {
  var __prisma: PrismaClient | undefined;
}

// Reuse a single PrismaClient instance across hot reloads (Next.js dev)
// instead of exhausting DB connections.
export const prisma = global.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

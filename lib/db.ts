import "server-only";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Reuse a single PrismaClient instance across hot reloads (Next.js dev)
// instead of exhausting DB connections.
export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

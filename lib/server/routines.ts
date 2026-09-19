import "server-only";
import { prisma } from "@/lib/db";
import type {
  CreateRoutineInput,
  Routine,
  UpdateRoutineInput,
} from "@/lib/types";

/**
 * RSC can pass a `Date` straight through as a Server Component prop, but
 * `@/lib/types`'s `Routine` type is the wire-format contract
 * (`createdAt: string`, ISO) shared with the Route Handlers, which DO
 * serialize through JSON. Normalize here so Server Component callers get
 * the same shape either way.
 */
function serializeRoutine(routine: {
  createdAt: Date;
  updatedAt: Date;
  onceDate: Date | null;
  [key: string]: unknown;
}): Routine {
  return {
    ...routine,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
    onceDate: routine.onceDate ? routine.onceDate.toISOString().slice(0, 10) : null,
  } as Routine;
}

export async function listRoutines(userId: string, includeInactive = false) {
  const routines = await prisma.routine.findMany({
    where: { userId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return routines.map(serializeRoutine);
}

/**
 * Scoped to `userId` so one user can never read/modify another's routine —
 * a mismatched id returns null (the caller turns that into a 404, not a
 * 403, to avoid confirming a routine id exists for someone who doesn't own it).
 */
export async function getOwnedRoutine(userId: string, id: string) {
  const routine = await prisma.routine.findUnique({ where: { id } });
  if (!routine || routine.userId !== userId) return null;
  return routine;
}

/**
 * `onceDate` travels the wire as a bare `yyyy-MM-dd` string (matching the
 * `@db.Date` column and `describeSchedule`/`isDue`'s string|Date handling),
 * but Prisma's client requires a `Date` for a `DateTime` field — a raw
 * string throws "Invalid value ... Expected ISO-8601 DateTime".
 */
function toPrismaOnceDate(onceDate: string | undefined): Date | undefined {
  return onceDate ? new Date(onceDate) : undefined;
}

export function createRoutine(userId: string, input: CreateRoutineInput) {
  return prisma.routine.create({
    data: { ...input, userId, onceDate: toPrismaOnceDate(input.onceDate) },
  });
}

export async function updateRoutine(
  userId: string,
  id: string,
  input: UpdateRoutineInput,
) {
  const owned = await getOwnedRoutine(userId, id);
  if (!owned) return null;
  return prisma.routine.update({
    where: { id },
    data: { ...input, onceDate: toPrismaOnceDate(input.onceDate) },
  });
}

export async function deleteRoutine(userId: string, id: string) {
  const owned = await getOwnedRoutine(userId, id);
  if (!owned) return false;
  await prisma.routine.delete({ where: { id } });
  return true;
}

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
  [key: string]: unknown;
}): Routine {
  return {
    ...routine,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
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

export function createRoutine(userId: string, input: CreateRoutineInput) {
  return prisma.routine.create({ data: { ...input, userId } });
}

export async function updateRoutine(
  userId: string,
  id: string,
  input: UpdateRoutineInput,
) {
  const owned = await getOwnedRoutine(userId, id);
  if (!owned) return null;
  return prisma.routine.update({ where: { id }, data: input });
}

export async function deleteRoutine(userId: string, id: string) {
  const owned = await getOwnedRoutine(userId, id);
  if (!owned) return false;
  await prisma.routine.delete({ where: { id } });
  return true;
}

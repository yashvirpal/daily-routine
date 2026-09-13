import "server-only";
import { prisma } from "@/lib/db";
import type { UpsertCheckInInput } from "@/lib/types";

/** Same reasoning as routines.ts's getOwnedRoutine — 404, not 403, on mismatch. */
async function ownsRoutine(userId: string, routineId: string) {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    select: { userId: true },
  });
  return routine?.userId === userId;
}

export async function listCheckins(
  userId: string,
  params: { routineId?: string; start?: string; end?: string },
) {
  const { routineId, start, end } = params;
  if (routineId && !(await ownsRoutine(userId, routineId))) return null;

  return prisma.dailyLog.findMany({
    where: {
      routine: { userId },
      routineId,
      date:
        start || end
          ? {
              gte: start ? new Date(start) : undefined,
              lte: end ? new Date(end) : undefined,
            }
          : undefined,
    },
    orderBy: { date: "asc" },
  });
}

/** Create or update the check-in for a routine+date (idempotent). Null if the routine isn't the caller's. */
export async function upsertCheckin(userId: string, input: UpsertCheckInInput) {
  const { routineId, date, completed, count, note } = input;
  if (!(await ownsRoutine(userId, routineId))) return null;

  const day = new Date(date);
  return prisma.dailyLog.upsert({
    where: { routineId_date: { routineId, date: day } },
    create: {
      routineId,
      date: day,
      completed: completed ?? true,
      count: count ?? 1,
      note,
    },
    update: { completed, count, note },
  });
}

export async function removeCheckin(
  userId: string,
  routineId: string,
  date: string,
) {
  if (!(await ownsRoutine(userId, routineId))) return false;
  await prisma.dailyLog.delete({
    where: { routineId_date: { routineId, date: new Date(date) } },
  });
  return true;
}

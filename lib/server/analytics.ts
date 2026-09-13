import "server-only";
import { prisma } from "@/lib/db";
import type { Routine, DailyLog } from "@/lib/db";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eachDate(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (
    let d = new Date(start);
    d.getTime() <= end.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    days.push(new Date(d));
  }
  return days;
}

/** Whether a routine is scheduled ("due") on the given date. */
function isDue(
  routine: Pick<Routine, "frequency" | "daysOfWeek" | "createdAt">,
  date: Date,
): boolean {
  // Compare calendar days only — a routine created at any time today is due today.
  if (toDateOnly(date) < toDateOnly(routine.createdAt)) return false;
  if (routine.frequency === "DAILY") return true;
  return routine.daysOfWeek.includes(date.getDay());
}

type DayBreakdown = {
  date: string;
  dueCount: number;
  completedCount: number;
  completionRate: number;
};

/** Shared by getSummary/getYearlySummary (and their admin, all-users
 * variants): per-day due/completed counts for [start, end], plus the active
 * routines fetched along the way (so callers needing streaks don't
 * re-query them). `userId` undefined = aggregate across every user. */
async function computeDailyBreakdown(
  userId: string | undefined,
  startDate: Date,
  endDate: Date,
): Promise<{ routines: Routine[]; days: DayBreakdown[] }> {
  const routineWhere = userId ? { userId, isActive: true } : { isActive: true };
  const [routines, logs] = await Promise.all([
    prisma.routine.findMany({ where: routineWhere }),
    prisma.dailyLog.findMany({
      where: {
        ...(userId ? { routine: { userId } } : {}),
        date: { gte: startDate, lte: endDate },
        completed: true,
      },
    }),
  ]);

  const logsByDate = new Map<string, DailyLog[]>();
  for (const log of logs) {
    const key = toDateOnly(log.date);
    logsByDate.set(key, [...(logsByDate.get(key) ?? []), log]);
  }

  const days = eachDate(startDate, endDate).map((date) => {
    const dueRoutines = routines.filter((r) => isDue(r, date));
    const completedIds = new Set(
      (logsByDate.get(toDateOnly(date)) ?? []).map((l) => l.routineId),
    );
    const dueCount = dueRoutines.length;
    const completedCount = dueRoutines.filter((r) =>
      completedIds.has(r.id),
    ).length;
    return {
      date: toDateOnly(date),
      dueCount,
      completedCount,
      completionRate: dueCount === 0 ? 1 : completedCount / dueCount,
    };
  });

  return { routines, days };
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function bucketByMonth(days: DayBreakdown[], year: number) {
  const buckets = MONTH_LABELS.map((label, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    label,
    dueCount: 0,
    completedCount: 0,
  }));
  for (const day of days) {
    const monthIndex = Number(day.date.slice(5, 7)) - 1;
    buckets[monthIndex].dueCount += day.dueCount;
    buckets[monthIndex].completedCount += day.completedCount;
  }
  return buckets.map((b) => ({
    ...b,
    completionRate: b.dueCount === 0 ? 1 : b.completedCount / b.dueCount,
  }));
}

function overallRate(days: DayBreakdown[]) {
  const totalDue = days.reduce((sum, d) => sum + d.dueCount, 0);
  const totalCompleted = days.reduce((sum, d) => sum + d.completedCount, 0);
  return totalDue === 0 ? 1 : totalCompleted / totalDue;
}

/** Shared by getYearlySummary/getAdminYearlySummary: the [Jan 1, today-or-Dec-31]
 * range for `year`, capped at today so a year that isn't over yet doesn't
 * count its remaining months as "due and never completed". */
function yearRange(year: number) {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const todayUTC = new Date(toDateOnly(new Date()));
  const endDate = yearEnd.getTime() < todayUTC.getTime() ? yearEnd : todayUTC;
  return { startDate, endDate, hasRange: endDate.getTime() >= startDate.getTime() };
}

/** Daily/weekly/monthly summary + per-routine streaks for [start, end], scoped to `userId`. */
export async function getSummary(userId: string, start: string, end: string) {
  const { routines, days } = await computeDailyBreakdown(
    userId,
    new Date(start),
    new Date(end),
  );
  return {
    start,
    end,
    days,
    overallCompletionRate: overallRate(days),
    streaks: await getStreaks(routines),
  };
}

/** Same as getSummary, but aggregated across every user (admin overview) —
 * no per-routine streaks (meaningless without owner attribution); instead
 * carries the counts an admin dashboard wants (total users/routines). */
export async function getAdminSummary(start: string, end: string) {
  const [{ routines, days }, totalUsers] = await Promise.all([
    computeDailyBreakdown(undefined, new Date(start), new Date(end)),
    prisma.user.count(),
  ]);
  return {
    start,
    end,
    days,
    overallCompletionRate: overallRate(days),
    totalUsers,
    totalActiveRoutines: routines.length,
  };
}

/** Yearly summary bucketed by month (12 points, not 365 daily bars), scoped to `userId`. */
export async function getYearlySummary(userId: string, year: number) {
  const { startDate, endDate, hasRange } = yearRange(year);
  const { routines, days } = hasRange
    ? await computeDailyBreakdown(userId, startDate, endDate)
    : {
        routines: await prisma.routine.findMany({ where: { userId, isActive: true } }),
        days: [] as DayBreakdown[],
      };
  return {
    year: String(year),
    months: bucketByMonth(days, year),
    overallCompletionRate: overallRate(days),
    streaks: await getStreaks(routines),
  };
}

/** Same as getYearlySummary, but aggregated across every user. */
export async function getAdminYearlySummary(year: number) {
  const { startDate, endDate, hasRange } = yearRange(year);
  const [breakdown, totalUsers] = await Promise.all([
    hasRange
      ? computeDailyBreakdown(undefined, startDate, endDate)
      : prisma.routine
          .findMany({ where: { isActive: true } })
          .then((routines) => ({ routines, days: [] as DayBreakdown[] })),
    prisma.user.count(),
  ]);
  const { routines, days } = breakdown;
  return {
    year: String(year),
    months: bucketByMonth(days, year),
    overallCompletionRate: overallRate(days),
    totalUsers,
    totalActiveRoutines: routines.length,
  };
}

/** Current + longest streak of consecutive due-and-completed days, per routine. */
export async function getStreaks(routines: Routine[]) {
  const results = [];
  for (const routine of routines) {
    const logs = await prisma.dailyLog.findMany({
      where: { routineId: routine.id, completed: true },
      orderBy: { date: "desc" },
    });
    const completedDates = new Set(logs.map((l) => toDateOnly(l.date)));

    // Walk backwards from today (UTC calendar day, matching how dates are
    // stored — see the note in schema.prisma / docs/CONTEXT.md) counting
    // consecutive completed due-days.
    let currentStreak = 0;
    const cursor = new Date(toDateOnly(new Date()));
    while (toDateOnly(cursor) >= toDateOnly(routine.createdAt)) {
      if (!isDue(routine, cursor)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      if (completedDates.has(toDateOnly(cursor))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak: scan all due days from creation to today.
    let longestStreak = 0;
    let running = 0;
    const scanStart = new Date(toDateOnly(routine.createdAt));
    const scanEnd = new Date(toDateOnly(new Date()));
    for (const day of eachDate(scanStart, scanEnd)) {
      if (!isDue(routine, day)) continue;
      if (completedDates.has(toDateOnly(day))) {
        running += 1;
        longestStreak = Math.max(longestStreak, running);
      } else {
        running = 0;
      }
    }

    results.push({
      routineId: routine.id,
      currentStreak,
      longestStreak,
      lastCompletedDate: logs[0] ? toDateOnly(logs[0].date) : null,
    });
  }
  return results;
}

export interface RoutineStreak {
  routineId: string;
  currentStreak: number; // consecutive due-days completed, ending today/yesterday
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  dueCount: number;
  completedCount: number;
  completionRate: number | null; // 0-1, null = nothing was due
}

export interface PeriodSummary {
  /** Inclusive ISO date range. */
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  days: DailySummary[];
  overallCompletionRate: number | null; // 0-1, null = nothing was due
  streaks: RoutineStreak[];
}

/** Today = a PeriodSummary with a single day. Week/Month = a rolling window
 * (last 7 / last 30 days) — same shape, different range. */
export type WeeklySummary = PeriodSummary;
export type MonthlySummary = PeriodSummary;

export interface MonthlyBucket {
  month: string; // YYYY-MM
  label: string; // "Jan"
  dueCount: number;
  completedCount: number;
  completionRate: number | null; // 0-1, null = nothing was due
}

/** A calendar-year report, bucketed by month (12 points) rather than by
 * day — 365 individual bars isn't a readable chart. */
export interface YearlySummary {
  year: string; // YYYY
  months: MonthlyBucket[];
  overallCompletionRate: number | null; // 0-1, null = nothing was due
  streaks: RoutineStreak[];
}

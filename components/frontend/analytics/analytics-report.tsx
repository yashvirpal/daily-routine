import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CompletionChart,
  type CompletionPoint,
} from "@/components/frontend/analytics/completion-chart";
import { PeriodTabs, type Period } from "@/components/frontend/analytics/period-tabs";
import { StatTile } from "@/components/frontend/analytics/stat-tile";
import {
  getAdminSummary,
  getAdminYearlySummary,
  getSummary,
  getYearlySummary,
} from "@/lib/server/analytics";
import type { RoutineStreak } from "@/lib/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function fullDateLabel(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** `null` means nothing was due in the period — no meaningful rate to show. */
function formatRate(rate: number | null): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

function StreakBadges({ streaks }: { streaks: RoutineStreak[] }) {
  if (streaks.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        Streaks
      </h2>
      <div className="flex flex-wrap gap-2">
        {streaks.map((s) => (
          <Badge key={s.routineId} variant="secondary" className="gap-1">
            <Flame className="size-3.5" />
            {s.currentStreak}d (best {s.longestStreak}d)
          </Badge>
        ))}
      </div>
    </div>
  );
}

/** The Today period is a single data point — a stat tile + progress bar
 * reads better than a one-bar chart (see the dataviz form heuristic: a
 * single headline is a stat tile, not a chart). No `userId` = aggregate
 * across every user (the admin overview), which skips streaks (no owner
 * attribution to show) in favor of Total users/Active routines tiles. */
async function TodayReport({ userId }: { userId?: string }) {
  const summary = userId
    ? await getSummary(userId, today(), today())
    : await getAdminSummary(today(), today());
  const day = summary.days[0];
  const percent = day.completionRate == null ? null : Math.round(day.completionRate * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Completion rate" value={formatRate(day.completionRate)} />
        {"totalUsers" in summary ? (
          <>
            <StatTile label="Total users" value={String(summary.totalUsers)} />
            <StatTile label="Active routines" value={String(summary.totalActiveRoutines)} />
          </>
        ) : (
          <>
            <StatTile label="Due today" value={String(day.dueCount)} />
            <StatTile label="Completed" value={String(day.completedCount)} />
          </>
        )}
      </div>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Today&apos;s progress
        </h2>
        {percent == null ? (
          <p className="text-sm text-muted-foreground">Nothing due today.</p>
        ) : (
          <Progress value={percent} />
        )}
      </Card>
      {"streaks" in summary && <StreakBadges streaks={summary.streaks} />}
    </div>
  );
}

async function RollingReport({
  userId,
  windowDays,
  chartLabel,
  labelFormat,
}: {
  userId?: string;
  windowDays: number;
  chartLabel: string;
  labelFormat: (dateISO: string) => string;
}) {
  const start = daysAgo(windowDays - 1);
  const summary = userId
    ? await getSummary(userId, start, today())
    : await getAdminSummary(start, today());

  const data: CompletionPoint[] = summary.days.map((d) => ({
    key: d.date,
    label: labelFormat(d.date),
    tooltipLabel: fullDateLabel(d.date),
    dueCount: d.dueCount,
    completedCount: d.completedCount,
    completionRate: d.completionRate,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Completion rate"
          value={formatRate(summary.overallCompletionRate)}
        />
        {"totalUsers" in summary ? (
          <>
            <StatTile label="Total users" value={String(summary.totalUsers)} />
            <StatTile label="Active routines" value={String(summary.totalActiveRoutines)} />
          </>
        ) : (
          <>
            <StatTile label="Active streaks" value={String(summary.streaks.length)} />
            <StatTile
              label="Best current streak"
              value={`${summary.streaks.reduce((max, s) => Math.max(max, s.currentStreak), 0)}d`}
            />
          </>
        )}
      </div>
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          {chartLabel}
        </h2>
        <CompletionChart data={data} />
      </Card>
      {"streaks" in summary && <StreakBadges streaks={summary.streaks} />}
    </div>
  );
}

async function YearReport({ userId, year }: { userId?: string; year: number }) {
  const summary = userId
    ? await getYearlySummary(userId, year)
    : await getAdminYearlySummary(year);
  const currentYear = new Date().getFullYear();

  const data: CompletionPoint[] = summary.months.map((m) => ({
    key: m.month,
    label: m.label,
    tooltipLabel: `${m.label} ${year}`,
    dueCount: m.dueCount,
    completedCount: m.completedCount,
    completionRate: m.completionRate,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Completion rate"
          value={formatRate(summary.overallCompletionRate)}
        />
        {"totalUsers" in summary ? (
          <>
            <StatTile label="Total users" value={String(summary.totalUsers)} />
            <StatTile label="Active routines" value={String(summary.totalActiveRoutines)} />
          </>
        ) : (
          <>
            <StatTile label="Active streaks" value={String(summary.streaks.length)} />
            <StatTile
              label="Best current streak"
              value={`${summary.streaks.reduce((max, s) => Math.max(max, s.currentStreak), 0)}d`}
            />
          </>
        )}
      </div>
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {year}, by month
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" asChild>
              <Link href={`?period=year&year=${year - 1}`} aria-label="Previous year">
                &larr;
              </Link>
            </Button>
            <span className="w-12 text-center text-sm tabular-nums">{year}</span>
            {year < currentYear ? (
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`?period=year&year=${year + 1}`} aria-label="Next year">
                  &rarr;
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon-xs" disabled aria-label="Next year">
                &rarr;
              </Button>
            )}
          </div>
        </div>
        <CompletionChart data={data} />
      </Card>
      {"streaks" in summary && <StreakBadges streaks={summary.streaks} />}
    </div>
  );
}

/** The full analytics report — period tabs + the report body for whichever
 * period is selected. Shared between /analytics (self), an admin's
 * per-user drill-down, and the admin overview (`userId` omitted =
 * aggregate across every user). */
export function AnalyticsReport({
  userId,
  basePath,
  period,
  year,
}: {
  userId?: string;
  basePath: string;
  period: Period;
  year?: number;
}) {
  const reportYear = year ?? new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      <PeriodTabs basePath={basePath} period={period} />
      {period === "today" && <TodayReport userId={userId} />}
      {period === "week" && (
        <RollingReport
          userId={userId}
          windowDays={7}
          chartLabel="Last 7 days"
          labelFormat={(d) =>
            new Date(d).toLocaleDateString(undefined, { weekday: "short" })
          }
        />
      )}
      {period === "month" && (
        <RollingReport
          userId={userId}
          windowDays={30}
          chartLabel="Last 30 days"
          labelFormat={(d) => String(new Date(d).getUTCDate())}
        />
      )}
      {period === "year" && <YearReport userId={userId} year={reportYear} />}
    </div>
  );
}

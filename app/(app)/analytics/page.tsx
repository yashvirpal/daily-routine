import { redirect } from "next/navigation";
import { AnalyticsReport } from "@/components/frontend/analytics/analytics-report";
import type { Period } from "@/components/frontend/analytics/period-tabs";
import { getSession } from "@/lib/auth";

const VALID_PERIODS: Period[] = ["today", "week", "month", "year"];

export default async function AnalyticsPage({
  searchParams,
}: PageProps<"/analytics">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const periodParam = Array.isArray(params.period)
    ? params.period[0]
    : params.period;
  const period = VALID_PERIODS.includes(periodParam as Period)
    ? (periodParam as Period)
    : "week";
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const year = yearParam ? Number(yearParam) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Your completion rate and streaks.
        </p>
      </div>
      <AnalyticsReport
        userId={session.sub}
        basePath="/analytics"
        period={period}
        year={year}
      />
    </div>
  );
}

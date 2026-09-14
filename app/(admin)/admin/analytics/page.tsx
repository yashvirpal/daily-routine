import type { Metadata } from "next";
import { AnalyticsReport } from "@/components/frontend/analytics/analytics-report";
import type { Period } from "@/components/frontend/analytics/period-tabs";

export const metadata: Metadata = { title: "Admin · Analytics" };

const VALID_PERIODS: Period[] = ["today", "week", "month", "year"];

export default async function AdminAnalyticsPage({
  searchParams,
}: PageProps<"/admin/analytics">) {
  // AdminLayout already redirects anything but a signed-in admin away.
  const sp = await searchParams;
  const periodParam = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const period = VALID_PERIODS.includes(periodParam as Period)
    ? (periodParam as Period)
    : "week";
  const yearParam = Array.isArray(sp.year) ? sp.year[0] : sp.year;
  const year = yearParam ? Number(yearParam) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Aggregate activity across every user.
        </p>
      </div>
      {/* No userId — AnalyticsReport aggregates across every user. */}
      <AnalyticsReport basePath="/admin/analytics" period={period} year={year} />
    </div>
  );
}

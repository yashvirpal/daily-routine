"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

/** Navigates to `${basePath}?period=X`, dropping any other query params
 * (e.g. `year`) — a fresh period always starts from that period's default range. */
export function PeriodTabs({
  basePath,
  period,
}: {
  basePath: string;
  period: Period;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={period}
      onValueChange={(value) => router.push(`${basePath}?period=${value}`)}
    >
      <TabsList>
        {PERIODS.map((p) => (
          <TabsTrigger key={p.value} value={p.value}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

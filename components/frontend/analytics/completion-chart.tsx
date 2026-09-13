"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** One bar's worth of data — a day, or a rolled-up month. `label` is the
 * x-axis tick text (kept short: a weekday, a day number, a month name);
 * `tooltipLabel` is the fuller text shown on hover. */
export interface CompletionPoint {
  key: string;
  label: string;
  tooltipLabel: string;
  dueCount: number;
  completedCount: number;
  completionRate: number; // 0-1
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CompletionPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{point.tooltipLabel}</p>
      <p className="text-muted-foreground">
        {point.completedCount}/{point.dueCount} completed (
        {Math.round(point.completionRate * 100)}%)
      </p>
    </div>
  );
}

/** Single-series completion rate over time — one hue, no legend needed. */
export function CompletionChart({ data }: { data: CompletionPoint[] }) {
  const points = data.map((d) => ({
    ...d,
    percent: Math.round(d.completionRate * 100),
  }));
  // Thin out x-axis ticks once there are more bars than fit comfortably
  // (the Month view can have up to 31) — 12 (the Year view's month count)
  // still fits without thinning.
  const tickInterval =
    points.length > 12 ? Math.ceil(points.length / 8) - 1 : 0;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="var(--muted-foreground)"
            interval={tickInterval}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={36}
            stroke="var(--muted-foreground)"
          />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            content={<CustomTooltip />}
          />
          <Bar
            dataKey="percent"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalyticsReport } from "@/components/frontend/analytics/analytics-report";
import type { Period } from "@/components/frontend/analytics/period-tabs";
import { getUserById } from "@/lib/server/auth";

const VALID_PERIODS: Period[] = ["today", "week", "month", "year"];

export default async function AdminUserPage({
  params,
  searchParams,
}: PageProps<"/admin/users/[id]">) {
  // AdminLayout already redirects anything but a signed-in admin away.
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

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
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin">
            <ArrowLeft className="size-4" />
            Users
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{user.name ?? user.email}</h1>
          {user.role === "ADMIN" && <Badge variant="secondary">Admin</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <AnalyticsReport
        userId={user.id}
        basePath={`/admin/users/${user.id}`}
        period={period}
        year={year}
      />
    </div>
  );
}

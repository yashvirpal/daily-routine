import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoutineCheckinList } from "@/components/frontend/checkins/routine-checkin-list";
import { getSession } from "@/lib/auth";
import { isDue } from "@/lib/scheduling";
import { listCheckins } from "@/lib/server/checkins";
import { listRoutines } from "@/lib/server/routines";

export const metadata: Metadata = { title: "Today" };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const today = todayISO();
  const [routines, todaysCheckins] = await Promise.all([
    listRoutines(session.sub),
    listCheckins(session.sub, { start: today, end: today }),
  ]);
  const completedRoutineIds = (todaysCheckins ?? [])
    .filter((c) => c.completed)
    .map((c) => c.routineId);
  const dueRoutines = routines.filter((r) => isDue(r, new Date()));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <RoutineCheckinList
        routines={dueRoutines}
        initialCompletedIds={completedRoutineIds}
      />
    </div>
  );
}

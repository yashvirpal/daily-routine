import { redirect } from "next/navigation";
import { RoutineCheckinList } from "@/components/frontend/checkins/routine-checkin-list";
import { getSession } from "@/lib/auth";
import { listRoutines } from "@/lib/server/routines";

export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const routines = await listRoutines(session.sub);

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
      <RoutineCheckinList routines={routines} />
    </div>
  );
}

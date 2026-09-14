import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoutineList } from "@/components/frontend/routines/routine-list";
import { getSession } from "@/lib/auth";
import { listRoutines } from "@/lib/server/routines";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const routines = await listRoutines(session.sub, true);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your routines.</p>
      </div>
      <RoutineList routines={routines} />
    </div>
  );
}

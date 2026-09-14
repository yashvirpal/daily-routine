import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { RoutineList } from "@/components/frontend/routines/routine-list";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/server/auth";
import { listRoutines } from "@/lib/server/routines";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, routines] = await Promise.all([
    getUserById(session.sub),
    listRoutines(session.sub, true),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and routines.
        </p>
      </div>
      <ProfileSettingsForm user={user} />
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Your routines</h2>
        <RoutineList routines={routines} />
      </div>
    </div>
  );
}

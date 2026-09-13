import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/admin/profile-settings-form";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/server/auth";
import { getAppSettings } from "@/lib/server/app-settings";

export default async function AdminSettingsPage() {
  // AdminLayout already redirects anything but a signed-in admin away —
  // this check just narrows the type without an assertion.
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, settings] = await Promise.all([
    getUserById(session.sub),
    getAppSettings(),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Admin-only: your account and app-wide configuration.
        </p>
      </div>
      <ProfileSettingsForm user={user} />
      <SiteSettingsForm settings={settings} />
    </div>
  );
}

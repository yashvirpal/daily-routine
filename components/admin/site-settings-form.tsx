"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { AppSettings } from "@/lib/types";

/** App-wide config — affects every user, not just the admin editing it. */
export function SiteSettingsForm({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [siteName, setSiteName] = useState(settings.siteName);
  const [registrationOpen, setRegistrationOpen] = useState(settings.registrationOpen);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await api.admin.updateSettings({ siteName, registrationOpen });
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save changes.");
      }
    });
  }

  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-medium">Site settings</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Applies to every user across the app.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="site-name">Site name</Label>
          <Input
            id="site-name"
            required
            maxLength={60}
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Shown in the nav bar and browser tab.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={registrationOpen}
            onCheckedChange={(checked) => setRegistrationOpen(checked === true)}
          />
          Allow new registrations
        </label>
        {!registrationOpen && (
          <p className="text-xs text-muted-foreground">
            New accounts can&apos;t sign up at /register while this is off. Existing
            users can still log in.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && !error && (
          <p className="text-sm text-muted-foreground">Saved.</p>
        )}
        <Button type="submit" disabled={isPending} className="self-start">
          Save
        </Button>
      </form>
    </Card>
  );
}

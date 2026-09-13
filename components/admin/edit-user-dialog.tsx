"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { AdminUserSummary } from "@/lib/types";

/** Admin-only edit dialog for one user's name/email/role. `isSelf` disables
 * the admin checkbox — the API refuses self-demotion too, but disabling it
 * here avoids a round-trip just to find that out. */
export function EditUserDialog({
  user,
  isSelf,
}: {
  user: AdminUserSummary;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [isAdmin, setIsAdmin] = useState(user.role === "ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await api.admin.updateUser(user.id, {
          name: name.trim() || null,
          email,
          role: isAdmin ? "ADMIN" : "USER",
        });
        setOpen(false);
        router.refresh();
      } catch {
        setError("Couldn't save — that email may already be in use.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Edit ${user.email}`}>
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update {user.email}&apos;s name, email, or admin access.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`name-${user.id}`}>Name</Label>
              <Input
                id={`name-${user.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`email-${user.id}`}>Email</Label>
              <Input
                id={`email-${user.id}`}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isAdmin}
                disabled={isSelf}
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              Admin access
            </label>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                You can&apos;t remove your own admin access.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

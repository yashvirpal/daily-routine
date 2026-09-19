"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  RoutineScheduleFields,
  isScheduleValid,
  scheduleStateFromRoutine,
  scheduleStateToInput,
  type ScheduleState,
} from "@/components/frontend/routines/routine-schedule-fields";
import { api } from "@/lib/api";
import type { Routine } from "@/lib/types";

/** Edit dialog for an existing routine's name + schedule — mirrors
 * components/admin/edit-user-dialog.tsx's structural pattern. Editing is
 * intentionally scoped to name + schedule only (no description/icon/color/
 * targetCount — those aren't exposed in the create flow either). */
export function EditRoutineDialog({ routine }: { routine: Routine }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(routine.name);
  const [schedule, setSchedule] = useState<ScheduleState>(() =>
    scheduleStateFromRoutine(routine),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName(routine.name);
    setSchedule(scheduleStateFromRoutine(routine));
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !isScheduleValid(schedule)) return;
    startTransition(async () => {
      try {
        await api.routines.update(routine.id, {
          name: name.trim(),
          ...scheduleStateToInput(schedule),
        });
        setOpen(false);
        router.refresh();
      } catch {
        setError("Couldn't save — please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Edit ${routine.name}`}>
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit routine</DialogTitle>
            <DialogDescription>
              Update {routine.name}&apos;s name or schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`routine-name-${routine.id}`}>Name</Label>
              <Input
                id={`routine-name-${routine.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <RoutineScheduleFields value={schedule} onChange={setSchedule} />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending || !name.trim() || !isScheduleValid(schedule)}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

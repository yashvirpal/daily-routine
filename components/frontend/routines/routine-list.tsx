"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import type { Routine } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RoutineScheduleFields,
  defaultScheduleState,
  isScheduleValid,
  scheduleStateToInput,
  type ScheduleState,
} from "@/components/frontend/routines/routine-schedule-fields";
import { EditRoutineDialog } from "@/components/frontend/routines/edit-routine-dialog";
import { describeSchedule } from "@/lib/scheduling";
import { api } from "@/lib/api";
import { toast } from "sonner";

/** describeSchedule() only says "Once — scheduled" for a ONCE routine (it
 * doesn't know date-fns) — swap in the actual formatted date here. */
function scheduleSummary(routine: Routine): string {
  if (routine.frequency === "ONCE" && routine.onceDate) {
    return `Once — ${format(new Date(`${routine.onceDate}T00:00:00`), "PPP")}`;
  }
  return describeSchedule(routine);
}

export function RoutineList({ routines }: { routines: Routine[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState<ScheduleState>(defaultScheduleState());
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setSchedule(defaultScheduleState());
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function addRoutine() {
    if (!name.trim() || !isScheduleValid(schedule)) return;
    startTransition(async () => {
      try {
        await api.routines.create({
          name: name.trim(),
          ...scheduleStateToInput(schedule),
        });
        setOpen(false);
        resetForm();
        router.refresh();
      } catch {
        toast.error("Couldn't create routine — check the API server.");
      }
    });
  }

  function removeRoutine(routine: Routine) {
    startTransition(async () => {
      try {
        await api.routines.remove(routine.id);
        router.refresh();
      } catch {
        toast.error(`Couldn't delete "${routine.name}".`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Add routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New routine</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="routine-name">Name</Label>
                <Input
                  id="routine-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morning stretch"
                />
              </div>
              <RoutineScheduleFields value={schedule} onChange={setSchedule} />
            </div>
            <DialogFooter>
              <Button
                onClick={addRoutine}
                disabled={isPending || !name.trim() || !isScheduleValid(schedule)}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {routines.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No routines yet"
          description="Add your first one above to start building your daily routine."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {routines.map((routine) => (
            <li key={routine.id}>
              <Card className="flex-row items-center justify-between p-4">
                <div>
                  <p className="flex items-center gap-2">
                    {routine.name}
                    {!routine.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scheduleSummary(routine)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <EditRoutineDialog routine={routine} />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => removeRoutine(routine)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import type { Routine } from "@/lib/types";
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
import { api } from "@/lib/api";
import { toast } from "sonner";

export function RoutineList({ routines }: { routines: Routine[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function addRoutine() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await api.routines.create({ name: name.trim() });
        setName("");
        setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Add routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New routine</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="routine-name">Name</Label>
              <Input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning stretch"
                onKeyDown={(e) => e.key === "Enter" && addRoutine()}
              />
            </div>
            <DialogFooter>
              <Button onClick={addRoutine} disabled={isPending || !name.trim()}>
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
                  <p>{routine.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {routine.frequency === "DAILY"
                      ? "Every day"
                      : `${routine.daysOfWeek.length} day(s)/week`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() => removeRoutine(routine)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

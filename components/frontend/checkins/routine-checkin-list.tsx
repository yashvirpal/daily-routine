"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import type { Routine } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { toast } from "sonner";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RoutineCheckinList({
  routines,
  initialCompletedIds,
}: {
  routines: Routine[];
  /** Routine IDs already checked in today, from the DB — without this the
   * checkbox state was purely local and reset to "all unchecked" on every
   * reload, even for a routine checked in moments before. */
  initialCompletedIds: string[];
}) {
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(initialCompletedIds),
  );
  const [isPending, startTransition] = useTransition();

  function toggle(routine: Routine) {
    const next = new Set(completed);
    const willComplete = !next.has(routine.id);
    if (willComplete) next.add(routine.id);
    else next.delete(routine.id);
    setCompleted(next);

    startTransition(async () => {
      try {
        await api.checkins.upsert({
          routineId: routine.id,
          date: todayISO(),
          completed: willComplete,
        });
      } catch {
        toast.error(`Couldn't save "${routine.name}" — check the API server.`);
      }
    });
  }

  if (routines.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No routines yet"
        description="Add your first routine from Settings to start tracking today."
        action={
          <Button asChild size="sm">
            <Link href="/settings">Go to Settings</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {routines.map((routine) => {
        const isDone = completed.has(routine.id);
        return (
          <motion.li key={routine.id} layout>
            <Card
              className="flex-row items-center gap-3 p-4 cursor-pointer"
              onClick={() => toggle(routine)}
            >
              <Checkbox checked={isDone} disabled={isPending} />
              <div className="flex-1">
                <p
                  className={
                    isDone ? "text-muted-foreground line-through" : ""
                  }
                >
                  {routine.name}
                </p>
                {routine.description && (
                  <p className="text-xs text-muted-foreground">
                    {routine.description}
                  </p>
                )}
              </div>
            </Card>
          </motion.li>
        );
      })}
    </ul>
  );
}

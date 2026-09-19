"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CreateRoutineInput, Frequency, Routine } from "@/lib/types";

/** Frequencies the UI can actually pick — `CUSTOM` is legacy/vestigial
 * (see lib/scheduling.ts) and never written from here; an existing CUSTOM
 * routine loaded into the edit dialog is treated as WEEKLY. */
type PickableFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "ONCE";

export type MonthlyMode = "date" | "weekday";

/** Controlled state shape for <RoutineScheduleFields>. Superset of the
 * server fields relevant to every frequency, plus a UI-only `monthlyMode`
 * discriminator (the server infers by-date vs. by-weekday from which
 * fields are set — see lib/scheduling.ts's isDue). */
export interface ScheduleState {
  frequency: PickableFrequency;
  daysOfWeek: number[];
  monthlyMode: MonthlyMode;
  daysOfMonth: number[];
  monthlyWeekOrdinal: number | null;
  monthlyWeekday: number | null;
  onceDate: string | null; // yyyy-MM-dd
}

export function defaultScheduleState(): ScheduleState {
  return {
    frequency: "DAILY",
    daysOfWeek: [],
    monthlyMode: "date",
    daysOfMonth: [],
    monthlyWeekOrdinal: null,
    monthlyWeekday: null,
    onceDate: null,
  };
}

/** Build the initial <RoutineScheduleFields> state from an existing routine
 * (edit flow). */
export function scheduleStateFromRoutine(routine: Routine): ScheduleState {
  const frequency: PickableFrequency =
    routine.frequency === "CUSTOM" ? "WEEKLY" : (routine.frequency as PickableFrequency);
  const monthlyMode: MonthlyMode =
    routine.monthlyWeekOrdinal != null && routine.monthlyWeekday != null
      ? "weekday"
      : "date";
  return {
    frequency,
    daysOfWeek: routine.daysOfWeek,
    monthlyMode,
    daysOfMonth: routine.daysOfMonth,
    monthlyWeekOrdinal: routine.monthlyWeekOrdinal,
    monthlyWeekday: routine.monthlyWeekday,
    onceDate: routine.onceDate,
  };
}

/** Convert schedule state into the schedule-related subset of
 * `CreateRoutineInput`/`UpdateRoutineInput`, ready to spread into either
 * `api.routines.create`/`update`'s body. Only sends the fields relevant to
 * the active mode — the other mode's fields are simply omitted (not
 * cleared server-side; harmless since lib/scheduling.ts's `isDue` only
 * reads the fields belonging to the routine's current `frequency`). */
export function scheduleStateToInput(
  state: ScheduleState,
): Pick<
  CreateRoutineInput,
  | "frequency"
  | "daysOfWeek"
  | "daysOfMonth"
  | "monthlyWeekOrdinal"
  | "monthlyWeekday"
  | "onceDate"
> {
  const frequency = state.frequency as Frequency;
  switch (state.frequency) {
    case "DAILY":
      return { frequency };
    case "WEEKLY":
      return { frequency, daysOfWeek: state.daysOfWeek };
    case "MONTHLY":
      return state.monthlyMode === "weekday"
        ? {
            frequency,
            monthlyWeekOrdinal: state.monthlyWeekOrdinal ?? undefined,
            monthlyWeekday: state.monthlyWeekday ?? undefined,
          }
        : { frequency, daysOfMonth: state.daysOfMonth };
    case "ONCE":
      return { frequency, onceDate: state.onceDate ?? undefined };
  }
}

/** Whether the active mode has everything it needs to submit — mirrors the
 * existing `!name.trim()` disabled-button pattern in routine-list.tsx. */
export function isScheduleValid(state: ScheduleState): boolean {
  switch (state.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return state.daysOfWeek.length > 0;
    case "MONTHLY":
      return state.monthlyMode === "weekday"
        ? state.monthlyWeekOrdinal != null && state.monthlyWeekday != null
        : state.daysOfMonth.length > 0;
    case "ONCE":
      return state.onceDate != null;
  }
}

const FREQUENCIES: { value: PickableFrequency; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONCE", label: "Once" },
];

const WEEKDAYS = [
  { value: 0, short: "S", label: "Sunday" },
  { value: 1, short: "M", label: "Monday" },
  { value: 2, short: "T", label: "Tuesday" },
  { value: 3, short: "W", label: "Wednesday" },
  { value: 4, short: "T", label: "Thursday" },
  { value: 5, short: "F", label: "Friday" },
  { value: 6, short: "S", label: "Saturday" },
];

const ORDINALS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: -1, label: "Last" },
];

function parseDateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Shared, controlled schedule picker used by both the create and edit
 * routine dialogs — frequency toggle + the mode-specific sub-picker. */
export function RoutineScheduleFields({
  value,
  onChange,
}: {
  value: ScheduleState;
  onChange: (next: ScheduleState) => void;
}) {
  function toggleInSortedArray(arr: number[], n: number): number[] {
    return arr.includes(n)
      ? arr.filter((x) => x !== n)
      : [...arr, n].sort((a, b) => a - b);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label>Repeats</Label>
        <div className="grid grid-cols-4 gap-1">
          {FREQUENCIES.map((f) => (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={value.frequency === f.value ? "default" : "outline"}
              aria-pressed={value.frequency === f.value}
              onClick={() => onChange({ ...value, frequency: f.value })}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {value.frequency === "WEEKLY" && (
        <div className="flex flex-col gap-2">
          <Label>On these days</Label>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <Button
                key={d.value}
                type="button"
                size="icon-sm"
                variant={value.daysOfWeek.includes(d.value) ? "default" : "outline"}
                aria-pressed={value.daysOfWeek.includes(d.value)}
                aria-label={d.label}
                title={d.label}
                onClick={() =>
                  onChange({
                    ...value,
                    daysOfWeek: toggleInSortedArray(value.daysOfWeek, d.value),
                  })
                }
              >
                {d.short}
              </Button>
            ))}
          </div>
        </div>
      )}

      {value.frequency === "MONTHLY" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-1">
            <Button
              type="button"
              size="sm"
              variant={value.monthlyMode === "date" ? "default" : "outline"}
              aria-pressed={value.monthlyMode === "date"}
              onClick={() => onChange({ ...value, monthlyMode: "date" })}
            >
              By date
            </Button>
            <Button
              type="button"
              size="sm"
              variant={value.monthlyMode === "weekday" ? "default" : "outline"}
              aria-pressed={value.monthlyMode === "weekday"}
              onClick={() => onChange({ ...value, monthlyMode: "weekday" })}
            >
              By weekday
            </Button>
          </div>

          {value.monthlyMode === "date" ? (
            <div className="flex flex-col gap-2">
              <Label>Day(s) of month</Label>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <Button
                    key={day}
                    type="button"
                    size="icon-xs"
                    variant={value.daysOfMonth.includes(day) ? "default" : "outline"}
                    aria-pressed={value.daysOfMonth.includes(day)}
                    className="text-xs"
                    onClick={() =>
                      onChange({
                        ...value,
                        daysOfMonth: toggleInSortedArray(value.daysOfMonth, day),
                      })
                    }
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Occurrence</Label>
              <div className="grid grid-cols-5 gap-1">
                {ORDINALS.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    size="sm"
                    variant={value.monthlyWeekOrdinal === o.value ? "default" : "outline"}
                    aria-pressed={value.monthlyWeekOrdinal === o.value}
                    onClick={() => onChange({ ...value, monthlyWeekOrdinal: o.value })}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
              <Label>Weekday</Label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    size="icon-sm"
                    variant={value.monthlyWeekday === d.value ? "default" : "outline"}
                    aria-pressed={value.monthlyWeekday === d.value}
                    aria-label={d.label}
                    title={d.label}
                    onClick={() => onChange({ ...value, monthlyWeekday: d.value })}
                  >
                    {d.short}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {value.frequency === "ONCE" && (
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "justify-start font-normal",
                  !value.onceDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-4" />
                {value.onceDate ? format(parseDateOnly(value.onceDate), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value.onceDate ? parseDateOnly(value.onceDate) : undefined}
                onSelect={(date) =>
                  onChange({
                    ...value,
                    onceDate: date ? format(date, "yyyy-MM-dd") : null,
                  })
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

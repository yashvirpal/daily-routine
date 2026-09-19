type DueFields = {
  frequency: string;
  daysOfWeek: number[];
  daysOfMonth: number[];
  monthlyWeekOrdinal: number | null;
  monthlyWeekday: number | null;
  onceDate: string | Date | null;
  createdAt: string | Date;
};

export function toDateOnly(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

function isNthWeekdayOfMonth(
  date: Date,
  ordinal: number,
  weekday: number,
): boolean {
  if (date.getDay() !== weekday) return false;
  const day = date.getDate();
  if (ordinal === -1) {
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    return day + 7 > daysInMonth; // no more occurrences of this weekday this month
  }
  return Math.ceil(day / 7) === ordinal;
}

/** Whether a routine is scheduled ("due") on the given date. */
export function isDue(routine: DueFields, date: Date): boolean {
  // Compare calendar days only — a routine created at any time today is due today.
  if (toDateOnly(date) < toDateOnly(routine.createdAt)) return false;
  switch (routine.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
    case "CUSTOM":
      return routine.daysOfWeek.includes(date.getDay());
    case "MONTHLY":
      if (routine.monthlyWeekOrdinal != null && routine.monthlyWeekday != null) {
        return isNthWeekdayOfMonth(
          date,
          routine.monthlyWeekOrdinal,
          routine.monthlyWeekday,
        );
      }
      return routine.daysOfMonth.includes(date.getDate());
    case "ONCE":
      return (
        routine.onceDate != null &&
        toDateOnly(date) === toDateOnly(routine.onceDate)
      );
    default:
      return false;
  }
}

const ORDINAL_LABEL: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  [-1]: "last",
};
const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Short human-readable description of a routine's schedule. */
export function describeSchedule(
  routine: Pick<
    DueFields,
    | "frequency"
    | "daysOfWeek"
    | "daysOfMonth"
    | "monthlyWeekOrdinal"
    | "monthlyWeekday"
    | "onceDate"
  >,
): string {
  switch (routine.frequency) {
    case "DAILY":
      return "Every day";
    case "WEEKLY":
    case "CUSTOM":
      return `${routine.daysOfWeek.length} day(s)/week`;
    case "MONTHLY":
      if (routine.monthlyWeekOrdinal != null && routine.monthlyWeekday != null) {
        return `${ORDINAL_LABEL[routine.monthlyWeekOrdinal]} ${WEEKDAY_LABEL[routine.monthlyWeekday]} of month`;
      }
      return `Day(s) ${[...routine.daysOfMonth].sort((a, b) => a - b).join(", ")} of month`;
    case "ONCE":
      return routine.onceDate ? "Once — scheduled" : "Once";
    default:
      return "";
  }
}

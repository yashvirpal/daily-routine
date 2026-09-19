export type Frequency = "DAILY" | "WEEKLY" | "CUSTOM" | "MONTHLY" | "ONCE";

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency: Frequency;
  daysOfWeek: number[]; // 0 (Sun) - 6 (Sat), used for WEEKLY/CUSTOM
  daysOfMonth: number[]; // 1-31, used for MONTHLY (by-date mode)
  monthlyWeekOrdinal: number | null; // 1-4, or -1 for "last" (MONTHLY by-weekday mode)
  monthlyWeekday: number | null; // 0 (Sun) - 6 (Sat) (MONTHLY by-weekday mode)
  onceDate: string | null; // ISO date, used for ONCE
  targetCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateRoutineInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency?: Frequency;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  monthlyWeekOrdinal?: number;
  monthlyWeekday?: number;
  onceDate?: string;
  targetCount?: number;
}

export type UpdateRoutineInput = Partial<CreateRoutineInput> & {
  isActive?: boolean;
  sortOrder?: number;
};

/** Admin-only: a routine with its owner's identity attached. */
export interface AdminRoutineSummary extends Routine {
  ownerEmail: string;
  ownerId: string;
}

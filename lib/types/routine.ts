export type Frequency = "DAILY" | "WEEKLY" | "CUSTOM";

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency: Frequency;
  daysOfWeek: number[]; // 0 (Sun) - 6 (Sat), used for WEEKLY/CUSTOM
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

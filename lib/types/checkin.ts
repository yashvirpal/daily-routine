export interface CheckIn {
  id: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  count: number;
  note: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface UpsertCheckInInput {
  routineId: string;
  date: string; // YYYY-MM-DD
  completed?: boolean;
  count?: number;
  note?: string;
}

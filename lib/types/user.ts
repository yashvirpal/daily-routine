export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string; // ISO
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Admin-only: a user row with their routine count. */
export interface AdminUserSummary extends User {
  routineCount: number;
}

/** Admin-only: editable fields on another user. */
export interface UpdateUserInput {
  name?: string | null;
  email?: string;
  role?: Role;
}

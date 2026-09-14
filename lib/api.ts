import type {
  AppSettings,
  CreateRoutineInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  Routine,
  UpdateAppSettingsInput,
  UpdateRoutineInput,
  UpdateSelfInput,
  UpdateUserInput,
  UpsertCheckInInput,
  User,
} from "@/lib/types";

// Client-side fetch helper, for Client Components only. Same-origin now
// that the API lives at /api/* inside this app (no separate API server to
// point at, no CORS) — the browser sends the auth cookie automatically.
// Server Components should call lib/server/* directly instead (no HTTP
// round-trip needed) — this file only covers what the browser actually calls.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message ?? `${init?.method ?? "GET"} ${path} failed: ${res.status}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (input: RegisterInput) =>
      request<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    login: (input: LoginInput) =>
      request<User>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
    updateMe: (input: UpdateSelfInput) =>
      request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(input) }),
    forgotPassword: (input: ForgotPasswordInput) =>
      request<{ ok: true }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    resetPassword: (input: ResetPasswordInput) =>
      request<{ ok: true }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  routines: {
    create: (input: CreateRoutineInput) =>
      request<Routine>("/routines", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateRoutineInput) =>
      request<Routine>(`/routines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<void>(`/routines/${id}`, { method: "DELETE" }),
  },
  checkins: {
    upsert: (input: UpsertCheckInInput) =>
      request(`/checkins`, { method: "POST", body: JSON.stringify(input) }),
  },
  admin: {
    updateUser: (id: string, input: UpdateUserInput) =>
      request<User>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    updateSettings: (input: UpdateAppSettingsInput) =>
      request<AppSettings>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  },
};

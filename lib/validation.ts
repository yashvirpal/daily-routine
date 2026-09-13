import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const FREQUENCIES = ["DAILY", "WEEKLY", "CUSTOM"] as const;

export const CreateRoutineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  daysOfWeek: z.array(z.int()).optional(),
  targetCount: z.int().min(1).optional(),
});

export const UpdateRoutineSchema = CreateRoutineSchema.partial().extend({
  isActive: z.boolean().optional(),
  sortOrder: z.int().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).nullable().optional(),
  email: z.email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const UpdateAppSettingsSchema = z.object({
  siteName: z.string().min(1).max(60).optional(),
  registrationOpen: z.boolean().optional(),
});

export const UpdateSelfSchema = z
  .object({
    name: z.string().min(1).nullable().optional(),
    email: z.email().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: "currentPassword is required to set a new password",
    path: ["currentPassword"],
  });

export const UpsertCheckinSchema = z.object({
  routineId: z.string(),
  date: z.iso.date(),
  completed: z.boolean().optional(),
  count: z.int().min(0).optional(),
  note: z.string().optional(),
});

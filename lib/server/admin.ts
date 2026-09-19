import "server-only";
import { prisma } from "@/lib/db";
import type {
  AdminRoutineSummary,
  AdminUserSummary,
  PageParams,
  PageResult,
  UpdateUserInput,
  User,
} from "@/lib/types";

export class AdminError extends Error {}

const DEFAULT_PAGE_SIZE = 10;

// See the comment on serializeRoutine in routines.ts — Server Components
// get real Date objects from Prisma, but the shared types are the
// JSON-over-the-wire contract (createdAt: string).

export async function listAllUsers({
  q,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: PageParams = {}): Promise<PageResult<AdminUserSummary>> {
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { routines: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items = rows.map(({ _count, createdAt, ...user }) => ({
    ...user,
    createdAt: createdAt.toISOString(),
    routineCount: _count.routines,
  }));
  return { items, total, page, pageSize };
}

/** Admin-only: update another user's name/email/role. Returns null if
 * `targetUserId` doesn't exist; throws AdminError on a conflict (email
 * already taken by someone else). */
export async function updateUser(
  targetUserId: string,
  input: UpdateUserInput,
): Promise<User | null> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return null;

  if (input.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing && existing.id !== targetUserId) {
      throw new AdminError("Email already in use");
    }
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: input,
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listAllRoutines({
  q,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: PageParams = {}): Promise<PageResult<AdminRoutineSummary>> {
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.routine.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, email: true } } },
    }),
    prisma.routine.count({ where }),
  ]);

  const items = rows.map(
    ({ user, createdAt, updatedAt, onceDate, ...routine }) => ({
      ...routine,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      onceDate: onceDate ? onceDate.toISOString().slice(0, 10) : null,
      ownerId: user.id,
      ownerEmail: user.email,
    }),
  );
  return { items, total, page, pageSize };
}

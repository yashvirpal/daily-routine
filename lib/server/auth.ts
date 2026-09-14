import "server-only";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { User as PrismaUser } from "@/lib/db";
import { getAppSettings } from "@/lib/server/app-settings";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/server/email";
import type { LoginInput, RegisterInput, UpdateSelfInput, User } from "@/lib/types";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export class AuthError extends Error {}

// Route Handlers return this via NextResponse.json (real JSON, dates
// serialize fine either way); Server Components (layout.tsx -> <Nav>) pass
// it straight through as a prop, where RSC preserves `Date` as `Date` — so
// normalize to the shared `User` wire-format contract (createdAt: string)
// here, once, for both cases.
function toPublicUser(user: PrismaUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- discarding passwordHash on purpose
  const { passwordHash: _passwordHash, createdAt, ...rest } = user;
  return { ...rest, createdAt: createdAt.toISOString() };
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new AuthError("Email already registered");

  // Bootstrap: the very first account becomes ADMIN; everyone after is USER.
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    const settings = await getAppSettings();
    if (!settings.registrationOpen) {
      throw new AuthError("Registration is currently closed");
    }
  }
  const role = userCount === 0 ? "ADMIN" : "USER";

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name, role },
  });

  // Never let a slow/broken email provider fail registration — email.ts's
  // send() already swallows its own errors, this await just keeps the
  // ordering sane (send after the user actually exists).
  await sendWelcomeEmail(user.email, user.name);

  return toPublicUser(user);
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AuthError("Invalid email or password");
  }
  return toPublicUser(user);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toPublicUser(user) : null;
}

/** Self-service profile/password update — unlike admin's updateUser (which
 * edits someone else with no password field), a password change here
 * requires the caller's current password. Returns null if `userId` doesn't
 * exist; throws AuthError on a bad current password or a taken email. */
export async function updateSelf(
  userId: string,
  input: UpdateSelfInput,
): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new AuthError("Email already in use");
  }

  let passwordHash: string | undefined;
  if (input.newPassword) {
    const currentOk =
      !!input.currentPassword &&
      (await bcrypt.compare(input.currentPassword, user.passwordHash));
    if (!currentOk) throw new AuthError("Current password is incorrect");
    passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    },
  });
  return toPublicUser(updated);
}

/** Issues a password-reset link if `email` belongs to an account — always
 * resolves either way (never reveals whether the email exists, so this
 * can't be used to enumerate registered accounts). Invalidates any earlier
 * unused reset tokens for the account first, so only the newest link works. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  await sendPasswordResetEmail(user.email, rawToken);
}

/** Redeems a password-reset token. Throws AuthError if it's missing,
 * already used, or expired — the token row itself is deleted either way
 * once redeemed successfully, so it can't be replayed. */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw new AuthError("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

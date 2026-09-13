import "server-only";
import { prisma } from "@/lib/db";
import type { AppSettings, UpdateAppSettingsInput } from "@/lib/types";

const SINGLETON_ID = "singleton";

function serialize(row: {
  siteName: string;
  registrationOpen: boolean;
  updatedAt: Date;
}): AppSettings {
  return {
    siteName: row.siteName,
    registrationOpen: row.registrationOpen,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Site-wide settings — lazily created on first read/write, no seed step. */
export async function getAppSettings(): Promise<AppSettings> {
  const row = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID },
    update: {},
  });
  return serialize(row);
}

/** Admin-only: update site-wide settings. */
export async function updateAppSettings(
  input: UpdateAppSettingsInput,
): Promise<AppSettings> {
  const row = await prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...input },
    update: input,
  });
  return serialize(row);
}

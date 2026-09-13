import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UpdateAppSettingsSchema } from "@/lib/validation";
import { getAppSettings, updateAppSettings } from "@/lib/server/app-settings";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getAppSettings());
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const parsed = UpdateAppSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  return NextResponse.json(await updateAppSettings(parsed.data));
}

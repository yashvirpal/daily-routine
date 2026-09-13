import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UpsertCheckinSchema } from "@/lib/validation";
import { upsertCheckin, removeCheckin } from "@/lib/server/checkins";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const parsed = UpsertCheckinSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const checkin = await upsertCheckin(session.sub, parsed.data);
  if (!checkin) {
    return NextResponse.json({ message: "Routine not found" }, { status: 404 });
  }
  return NextResponse.json(checkin);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const routineId = searchParams.get("routineId");
  const date = searchParams.get("date");
  if (!routineId || !date) {
    return NextResponse.json(
      { message: "routineId and date are required" },
      { status: 400 },
    );
  }

  const removed = await removeCheckin(session.sub, routineId, date);
  if (!removed) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

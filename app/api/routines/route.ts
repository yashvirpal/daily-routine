import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CreateRoutineSchema } from "@/lib/validation";
import { createRoutine } from "@/lib/server/routines";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const parsed = CreateRoutineSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const routine = await createRoutine(session.sub, parsed.data);
  return NextResponse.json(routine, { status: 201 });
}

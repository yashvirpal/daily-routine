import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UpdateRoutineSchema } from "@/lib/validation";
import { updateRoutine, deleteRoutine } from "@/lib/server/routines";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/routines/[id]">,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const parsed = UpdateRoutineSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const routine = await updateRoutine(session.sub, id, parsed.data);
  if (!routine) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(routine);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/routines/[id]">,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const deleted = await deleteRoutine(session.sub, id);
  if (!deleted) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

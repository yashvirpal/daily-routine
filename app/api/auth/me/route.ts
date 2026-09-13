import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AuthError, getUserById, updateSelf } from "@/lib/server/auth";
import { UpdateSelfSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }
  const user = await getUserById(session.sub);
  if (!user) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(user);
}

/** Self-service profile/password update. */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const parsed = UpdateSelfSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  try {
    const user = await updateSelf(session.sub, parsed.data);
    if (!user) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    throw err;
  }
}

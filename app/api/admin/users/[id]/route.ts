import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UpdateUserSchema } from "@/lib/validation";
import { updateUser, AdminError } from "@/lib/server/admin";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/admin/users/[id]">,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const parsed = UpdateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { id } = await ctx.params;

  // Don't let an admin demote themselves out of admin from this screen —
  // easy way to lock yourself out with no seed step to recover with.
  if (id === session.sub && parsed.data.role === "USER") {
    return NextResponse.json(
      { message: "You can't remove your own admin access" },
      { status: 400 },
    );
  }

  try {
    const user = await updateUser(id, parsed.data);
    if (!user) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }
    throw err;
  }
}

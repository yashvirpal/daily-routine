import { NextResponse } from "next/server";
import { LoginSchema } from "@/lib/validation";
import { loginUser, AuthError } from "@/lib/server/auth";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const parsed = LoginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  try {
    const user = await loginUser(parsed.data);
    await setSessionCookie(user);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: 401 });
    }
    throw err;
  }
}

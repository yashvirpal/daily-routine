import { NextResponse } from "next/server";
import { RegisterSchema } from "@/lib/validation";
import { registerUser, AuthError } from "@/lib/server/auth";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const parsed = RegisterSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  try {
    const user = await registerUser(parsed.data);
    await setSessionCookie(user);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }
    throw err;
  }
}

import { NextResponse } from "next/server";
import { ResetPasswordSchema } from "@/lib/validation";
import { resetPassword, AuthError } from "@/lib/server/auth";

export async function POST(req: Request) {
  const parsed = ResetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    throw err;
  }
}

import { NextResponse } from "next/server";
import { ForgotPasswordSchema } from "@/lib/validation";
import { requestPasswordReset } from "@/lib/server/auth";

export async function POST(req: Request) {
  const parsed = ForgotPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  // Always the same response whether or not the email exists — see the
  // comment on requestPasswordReset for why.
  await requestPasswordReset(parsed.data.email);
  return NextResponse.json({ ok: true });
}

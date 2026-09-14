import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSummary } from "@/lib/server/analytics";
import { sendDailySummaryEmail } from "@/lib/server/email";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Triggered by Vercel Cron (see vercel.json's "crons") — Vercel sends
 * `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is
 * set as an env var, so this rejects anyone else calling it directly
 * (this sends to every user; it must not be publicly triggerable). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  const errors: { email: string; error: string }[] = [];

  for (const user of users) {
    try {
      const summary = await getSummary(user.id, today(), today());
      const day = summary.days[0];
      const bestCurrentStreak = summary.streaks.reduce(
        (max, s) => Math.max(max, s.currentStreak),
        0,
      );
      await sendDailySummaryEmail(user.email, user.name, {
        dueCount: day.dueCount,
        completedCount: day.completedCount,
        completionRate: day.completionRate,
        activeStreaks: summary.streaks.length,
        bestCurrentStreak,
      });
      sent += 1;
    } catch (err) {
      errors.push({
        email: user.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ total: users.length, sent, errors });
}

import "server-only";
import { Resend } from "resend";
import { appUrl } from "@/lib/server/app-url";

// Lazy singleton: constructing Resend with no/empty API key throws
// immediately, and this module is imported by request paths (register,
// forgot-password, the daily cron) that would otherwise crash at import
// time in dev before RESEND_API_KEY is ever configured.
let client: Resend | null = null;
function resend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return (client ??= new Resend(process.env.RESEND_API_KEY));
}

/** Resend's sandbox sender — works with no domain verification, but only
 * actually delivers to the email you signed up to Resend with. Set
 * EMAIL_FROM once you verify your own domain there. */
const FROM = process.env.EMAIL_FROM || "Daily Routine <onboarding@resend.dev>";

function layout(title: string, bodyHtml: string): string {
  // Plain, table-free inline-styled HTML — works fine in every mail
  // client without needing a templating library; a real design pass can
  // replace this later same as the rest of the UI (see docs/CONTEXT.md).
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:32px;font-size:12px;color:#888">Daily Routine</p>
  </div>`;
}

/** Sends via Resend if configured; logs and no-ops otherwise (never throws
 * — a failed/unconfigured email must never break the request that
 * triggered it, e.g. registration). */
async function send(to: string, subject: string, html: string) {
  const client = resend();
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  try {
    const { error } = await client.emails.send({ from: FROM, to, subject, html });
    if (error) console.error(`[email] send failed to ${to}:`, error);
  } catch (err) {
    console.error(`[email] send threw for ${to}:`, err);
  }
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  await send(
    to,
    "Welcome to Daily Routine",
    layout(
      `Welcome${name ? `, ${name}` : ""}!`,
      `<p>Your account is ready. Start by adding your first routine and checking in today.</p>
       <p><a href="${appUrl()}/today" style="color:#eb6834">Go to your Today page →</a></p>`,
    ),
  );
}

export async function sendPasswordResetEmail(to: string, rawToken: string) {
  const resetUrl = `${appUrl()}/reset-password?token=${rawToken}`;
  await send(
    to,
    "Reset your password",
    layout(
      "Reset your password",
      `<p>Someone (hopefully you) asked to reset the password on this account.</p>
       <p><a href="${resetUrl}" style="color:#eb6834">Choose a new password →</a></p>
       <p style="font-size:13px;color:#666">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>`,
    ),
  );
}

export interface DailySummaryData {
  dueCount: number;
  completedCount: number;
  completionRate: number; // 0-1
  activeStreaks: number;
  bestCurrentStreak: number;
}

export async function sendDailySummaryEmail(
  to: string,
  name: string | null,
  data: DailySummaryData,
) {
  const percent = Math.round(data.completionRate * 100);
  await send(
    to,
    `Your daily summary: ${percent}% complete`,
    layout(
      `Hi${name ? ` ${name}` : ""} — here's today so far`,
      `<p style="font-size:32px;font-weight:600;margin:0">${percent}%</p>
       <p style="color:#666;margin-top:4px">${data.completedCount} of ${data.dueCount} routines completed today</p>
       ${
         data.activeStreaks > 0
           ? `<p>🔥 ${data.activeStreaks} active streak${data.activeStreaks === 1 ? "" : "s"}, best currently ${data.bestCurrentStreak} day${data.bestCurrentStreak === 1 ? "" : "s"}</p>`
           : ""
       }
       <p><a href="${appUrl()}/today" style="color:#eb6834">Open Today →</a></p>`,
    ),
  );
}

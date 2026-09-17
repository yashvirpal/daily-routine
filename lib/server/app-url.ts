import "server-only";

/** The app's own absolute URL — for links inside emails, `metadataBase`,
 * Open Graph, etc.
 *
 * APP_URL (explicit) > VERCEL_PROJECT_PRODUCTION_URL (Vercel auto-injects
 * this into every deployment, no config needed, and it self-updates if the
 * project's domain ever changes — more robust than trusting APP_URL alone,
 * which silently kept resolving to the dev fallback in production once
 * already: the value looked correctly set in the dashboard, but reading it
 * back from a live request still returned undefined) > localhost, for pure
 * local dev with neither set. */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

import type { Page } from "@playwright/test";

/**
 * Registers a fresh, uniquely-emailed user through the UI and leaves `page`
 * signed in (the register call sets the httpOnly auth cookie, same as a
 * real user would get). Every protected page redirects to /login without
 * this, so most tests need it first.
 */
export async function registerAndLogin(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/today$/);
  return email;
}

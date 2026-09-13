import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers.js";

test("register, then log out, then log back in", async ({ page }) => {
  const email = await registerAndLogin(page);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Logged out again — protected pages should bounce back to /login.
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/today$/);
});

test("wrong password is rejected", async ({ page }) => {
  const email = await registerAndLogin(page);
  await page.getByRole("button", { name: "Log out" }).click();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

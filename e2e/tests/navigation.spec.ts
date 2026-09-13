import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers.js";

test.describe("navigation", () => {
  test("home redirects to Today when signed in", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  });

  test("protected pages redirect to Login when signed out", async ({
    page,
  }) => {
    await page.goto("/today");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("can navigate to Analytics and Settings", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/today");

    await page.getByRole("link", { name: "Analytics" }).click();
    await expect(page).toHaveURL(/\/analytics$/);
    await expect(
      page.getByRole("heading", { name: "Analytics" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();
  });
});

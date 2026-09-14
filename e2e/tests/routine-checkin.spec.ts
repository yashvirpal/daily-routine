import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers.js";

test("create a routine and check it in for today", async ({ page }) => {
  const name = `E2E routine ${Date.now()}`;

  await registerAndLogin(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Add routine" }).click();
  // Scoped to the dialog — the page also has a profile "Your name" field
  // that "Name" substring-matches otherwise (see getByLabel's default
  // matching behavior).
  await page.getByRole("dialog").getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name)).toBeVisible();

  await page.getByRole("link", { name: "Today" }).click();
  // The name renders in a <p> two levels below the clickable Card that also
  // holds the checkbox (see RoutineCheckinList) — ".." lands one level too
  // shallow to reach it.
  const row = page.getByText(name).locator("../..");
  const checkbox = row.getByRole("checkbox");
  await checkbox.click();
  await expect(checkbox).toBeChecked();
});

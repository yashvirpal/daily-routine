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
  // The click's own upsert call is fire-and-forget from the UI's
  // perspective (optimistic local state) — wait for it to actually land
  // before reloading, or the reload can race it and read stale data.
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/checkins")),
    checkbox.click(),
  ]);
  await expect(checkbox).toBeChecked();

  // Regression: the checked state used to be purely local React state,
  // initialized empty on every mount — it never read today's actual
  // persisted check-ins, so a reload silently showed everything as
  // unchecked again despite the DB (and Analytics) having it right.
  await page.reload();
  await expect(row.getByRole("checkbox")).toBeChecked();

  // Unchecking should persist the same way.
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/checkins")),
    row.getByRole("checkbox").click(),
  ]);
  await expect(row.getByRole("checkbox")).not.toBeChecked();
  await page.reload();
  await expect(row.getByRole("checkbox")).not.toBeChecked();
});

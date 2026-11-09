import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });

test("the feature tour steps with its arrows and keys, wraps, and never moves on its own", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const tour = page.getByLabel("Features", { exact: true });
  const count = page.getByText(/^\d+ \/ 7$/);
  await expect(count).toHaveText("1 / 7");
  await expect(tour.getByRole("heading", { name: "Decide where, together" })).toBeVisible();

  await page.getByRole("button", { name: "Next feature" }).click();
  await expect(count).toHaveText("2 / 7");
  await expect(tour.getByRole("heading", { name: "Dates that work for everyone" })).toBeVisible();

  await tour.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(count).toHaveText("1 / 7");
  await page.getByRole("button", { name: "Previous feature" }).click();
  await expect(count).toHaveText("7 / 7");
  await expect(tour.getByRole("heading", { name: "Find the booking in seconds" })).toBeVisible();
  await page.getByRole("button", { name: "Next feature" }).click();
  await expect(count).toHaveText("1 / 7");

  await page.clock.fastForward(60_000);
  await expect(count).toHaveText("1 / 7");
});

test("a tab on the drawn trip page jumps to its feature", async ({ page }) => {
  await page.goto("/");
  const tour = page.getByLabel("Features", { exact: true });
  await tour.getByRole("button", { name: "Money", includeHidden: true }).click();
  await expect(page.getByText(/^\d+ \/ 7$/)).toHaveText("4 / 7");
  await expect(tour.getByRole("heading", { name: "Split the bill, not the group" })).toBeVisible();
});

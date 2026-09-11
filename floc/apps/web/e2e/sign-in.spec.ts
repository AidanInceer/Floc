import { expect, test } from "@playwright/test";

import { priya, signIn } from "./people";

test("a wrong password is refused without saying which part was wrong", async ({ page }) => {
  await signIn(page, priya.email, "not-the-password");
  await expect(page.getByText("That email and password don't match.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("a signed-out visit to trips goes to the login page", async ({ page }) => {
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/login/);
});

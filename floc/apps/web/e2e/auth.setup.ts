import { expect, test as setup, type Page } from "@playwright/test";

import { nadia, priya, signIn } from "./people";

async function signedIn(page: Page, email: string) {
  await signIn(page, email);
  await expect(page).toHaveURL(/\/trips$/);
}

setup("the right password lands on your trips", async ({ page }) => {
  await signedIn(page, priya.email);
  await expect(page.getByText("Portugal, late summer")).toBeVisible();
  await page.context().storageState({ path: priya.state });
});

setup("a second person signs in", async ({ page }) => {
  await signedIn(page, nadia.email);
  await page.context().storageState({ path: nadia.state });
});

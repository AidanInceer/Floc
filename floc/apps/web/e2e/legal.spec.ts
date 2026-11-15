import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("a footer legal link rises as a sheet over the page, and closing steps back", async ({ page }) => {
  await page.goto("/");
  await page.locator(".site-footer").getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  const sheet = page.getByRole("dialog");
  const tabs = sheet.getByRole("navigation", { name: "Legal" });
  await expect(sheet.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");

  await tabs.getByRole("link", { name: "Cookies" }).click();
  await expect(page).toHaveURL(/\/cookies$/);
  await expect(sheet.getByRole("heading", { level: 1 })).toHaveText("Cookies");
  await expect(tabs.getByRole("link", { name: "Cookies" })).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a legal page reached by its URL is a page of its own", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

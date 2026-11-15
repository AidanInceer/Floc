import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("a footer legal link rises as a sheet over the page, and closing steps back", async ({ page }) => {
  await page.goto("/");
  await page.locator(".site-footer").getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  const sheet = page.getByRole("dialog");
  const tabs = sheet.getByRole("navigation", { name: "Legal" });
  await expect(sheet.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");

  await tabs.getByRole("link", { name: "Cookie policy" }).click();
  await expect(page).toHaveURL(/\/cookies$/);
  await expect(sheet.getByRole("heading", { level: 1 })).toHaveText("Cookie policy");
  await expect(tabs.getByRole("link", { name: "Cookie policy" })).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a legal page reached by its URL is a page of its own", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the cookie banner takes a choice by category in place, with no trip to another page", async ({ page, context }) => {
  await context.clearCookies({ name: "floc_consent" });
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Cookie preferences" });
  await banner.getByRole("button", { name: "Manage preferences" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(banner.getByText("Always active")).toBeVisible();
  await banner.locator("label", { hasText: "Analytics" }).click();
  await banner.getByRole("button", { name: "Save preferences" }).click();
  await expect(banner).toHaveCount(0);
  const consent = (await context.cookies()).find((cookie) => cookie.name === "floc_consent");
  expect(consent?.value).toMatch(/^1\.f0\.a1\./);
});

test("reject all answers the banner at once, on the same page", async ({ page, context }) => {
  await context.clearCookies({ name: "floc_consent" });
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Cookie preferences" });
  await banner.getByRole("button", { name: "Reject all" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  const consent = (await context.cookies()).find((cookie) => cookie.name === "floc_consent");
  expect(consent?.value).toMatch(/^1\.f0\.a0\./);
});

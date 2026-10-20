import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });

test("the finder filters on what must fit and ranks by what you like, never hiding a trip for it", async ({ page }) => {
  await page.goto("/explore");
  const rail = page.getByRole("complementary", { name: "Filters" });
  const count = page.getByText(/^\d+ trips$/).first();
  await rail.scrollIntoViewIfNeeded();
  await expect(count).toHaveText("25 trips");

  await rail.getByRole("button", { name: /^May, / }).click();
  const inMay = await count.textContent();
  expect(Number.parseInt(inMay ?? "", 10)).toBeLessThan(25);
  await expect(page.getByRole("button", { name: "May", exact: true })).toBeVisible();

  await rail.getByRole("button", { name: "Desert", exact: true }).click();
  await expect(count).toHaveText(inMay ?? "");
  await expect(page.getByText("Fits, but none of what you like")).toBeVisible();

  await page.getByRole("button", { name: "May", exact: true }).click();
  await expect(count).toHaveText("25 trips");

  await page.getByRole("button", { name: "More like this" }).first().click();
  await expect(page.getByRole("button", { name: /^Like / })).toBeVisible();
  await expect(count).toHaveText("24 trips");
});

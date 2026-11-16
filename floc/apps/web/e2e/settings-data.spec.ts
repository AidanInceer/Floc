import { expect, test } from "@playwright/test";

import { nadia } from "./people";

test.use({ storageState: nadia.state });

test("Your data changes the cookie choice and advertising email in place", async ({ page, context, baseURL }) => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  await context.addCookies([{ name: "floc_consent", value: `1.f0.a0.${yesterday}`, url: baseURL! }]);
  await page.goto("/profile?section=data");
  const data = page.locator("#settings-data");

  await data.locator("label", { hasText: "Analytics" }).click();
  await expect
    .poll(async () => (await context.cookies()).find((cookie) => cookie.name === "floc_consent")?.value)
    .toMatch(/^1\.f0\.a1\./);

  const email = data.getByRole("checkbox", { name: /Advertising email/ });
  await expect(email).not.toBeChecked();
  await data.locator("label", { hasText: "Advertising email" }).click();
  await expect(email).toBeChecked();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.locator("#settings-data").getByRole("checkbox", { name: /Advertising email/ })).toBeChecked();

  await page.locator("#settings-data").locator("label", { hasText: "Advertising email" }).click();
  await page.waitForLoadState("networkidle");
});

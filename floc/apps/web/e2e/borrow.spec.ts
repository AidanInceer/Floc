import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });

test("the borrow globe opens a trip's route stop by stop, and a spin brings up other trips", async ({ page }) => {
  await page.goto("/");
  const band = page.locator(".borrow");
  await band.scrollIntoViewIfNeeded();
  const titles = () => band.locator(".borrow-chip-title").allTextContents();
  const opening = await titles();
  expect(opening).toHaveLength(6);
  expect(opening[0]).toBe("Tokyo to Osaka");

  await band.getByRole("button", { name: "See the route: Tokyo to Osaka" }).click();
  const rail = band.locator(".borrow-rail");
  await expect(rail).toContainText("Stop 1 of 4");
  await rail.getByRole("button", { name: "Next stop" }).click();
  await expect(rail).toContainText("Stop 2 of 4");
  await expect(band.getByRole("button", { name: "Go to Hakone" })).toHaveAttribute("aria-current", "true");
  await expect(rail.getByRole("link", { name: "See the full trip" })).toHaveAttribute("href", "/explore/japan-golden-route");

  await band.getByRole("button", { name: "Back to the globe" }).click();
  await expect(rail).toHaveCount(0);
  expect(await titles()).toEqual(opening);

  await band.getByRole("button", { name: "Spin for me" }).click();
  await expect.poll(async () => (await titles()).filter((title) => !opening.includes(title)).length).toBeGreaterThan(0);
  expect(await titles()).toHaveLength(6);
});

import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

async function drag(page: Page, target: Locator, distance: number) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width - 20;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - distance, y, { steps: 10 });
  await page.mouse.up();
}

test.use({ reducedMotion: "reduce", viewport: { width: 1000, height: 900 } });

test("the feature film snaps one slide and loops through its middle copy", async ({ page }) => {
  await page.goto("/");
  const film = page.getByLabel("Features", { exact: true });
  const tabs = film.locator("..");
  const count = await tabs.locator("button[aria-pressed]").count();
  await expect(tabs.getByRole("button", { name: "Where", exact: true })).toHaveAttribute("aria-pressed", "true");
  await drag(page, film.locator(`[data-physical="${count}"] .film-text`), 500);
  await expect(tabs.getByRole("button", { name: "When", exact: true })).toHaveAttribute("aria-pressed", "true");

  await tabs.getByRole("button", { name: "Tickets", exact: true }).click();
  await expect(tabs.getByRole("button", { name: "Tickets", exact: true })).toHaveAttribute("aria-pressed", "true");
  await drag(page, film.locator(`[data-physical="${count * 2 - 1}"] .film-text`), 100);
  await expect(tabs.getByRole("button", { name: "Where", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => film.evaluate((el) => {
    const slides = [...el.querySelectorAll<HTMLElement>("[data-physical]")];
    const first = slides[0].offsetLeft;
    return Math.abs(el.scrollLeft - (slides[slides.length / 3].offsetLeft - first));
  })).toBeLessThan(2);
});

test("recommendations snap near the release, stop at edges and remain clickable", async ({ page }) => {
  await page.goto("/explore");
  const picks = page.getByLabel("For you", { exact: true });
  const track = picks.locator("ol");
  await track.scrollIntoViewIfNeeded();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeLessThan(12);
  const before = await page.evaluate(() => window.scrollY);
  await drag(page, track, 650);
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);

  const next = picks.getByRole("button", { name: "Next", exact: true });
  for (let step = 0; step < 5 && await next.isEnabled(); step++) await next.click();
  await expect(next).toBeDisabled();
  await drag(page, track, 100);
  await expect(next).toBeDisabled();
  await track.getByRole("button").last().click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(before);
});

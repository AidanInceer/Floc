import { expect, test } from "@playwright/test";

import { nadia, priya } from "./people";

test.describe("as a member", () => {
  test.use({ storageState: priya.state });

  test("the trip shows its money and its packing", async ({ page }) => {
    await page.goto("/trips");
    await page.getByText("Portugal, late summer").click();
    await expect(page).toHaveURL(/\/trip\/\d+/);
    const trip = new URL(page.url()).pathname.match(/\/trip\/\d+/)![0];

    await page.goto(`${trip}/money`);
    await expect(page.getByText("Dinner in Alfama").first()).toBeVisible();

    await page.goto(`${trip}/packing`);
    await expect(page.getByText("Beach towels").first()).toBeVisible();
  });

  test("a new trip can be started", async ({ page }) => {
    const name = `E2E trip ${Date.now()}`;
    await page.goto("/trips");
    await page.getByRole("button", { name: "New trip" }).click();
    await page.getByRole("dialog").getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Create trip" }).click();

    await expect(page).toHaveURL(/\/trip\/\d+/);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("an event loads on selection, saves, and reopens from its address", async ({ page }) => {
    let writes = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/days")) writes++;
    });
    await page.goto("/trips");
    await page.getByText("Portugal, late summer").click();
    await expect(page).toHaveURL(/\/trip\/\d+/);
    const trip = new URL(page.url()).pathname.match(/\/trip\/\d+/)![0];
    await page.goto(`${trip}/days`);
    await expect(page.getByRole("dialog", { name: "Event", exact: true })).not.toBeVisible();
    await page.getByRole("button", { name: /^Flight to Lisbon,/ }).click();
    await expect(page).toHaveURL(/\?event=\d+/);
    const dialog = page.getByRole("dialog", { name: "Event", exact: true });
    const name = dialog.getByRole("textbox", { name: "Event name", exact: true });
    await expect(name).toHaveValue("Flight to Lisbon");
    const saved = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/days"));
    await name.fill("Flight to Lisbon updated");
    await name.press("Tab");
    await saved;
    await page.reload();
    await expect(name).toHaveValue("Flight to Lisbon updated");
    const restored = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/days"));
    await name.fill("Flight to Lisbon");
    await name.press("Tab");
    await restored;
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${trip}/days$`));
    await page.getByRole("button", { name: /^Flight to Lisbon,/ }).click();
    await expect(name).toHaveValue("Flight to Lisbon");
    expect(writes).toBe(2);
  });
});

test("somebody else's trip looks the same as one that does not exist", async ({ browser }) => {
  const theirs = await browser.newContext({ storageState: nadia.state });
  const theirPage = await theirs.newPage();
  await theirPage.goto("/trips");
  await theirPage.getByText("The Dolomites, February").click();
  await expect(theirPage).toHaveURL(/\/trip\/\d+/);
  const trip = new URL(theirPage.url()).pathname.match(/\/trip\/\d+/)![0];
  await theirs.close();

  const mine = await browser.newContext({ storageState: priya.state });
  const page = await mine.newPage();
  await page.goto(trip);
  await expect(page.getByText("Nothing here")).toBeVisible();
  await page.goto("/trip/999999");
  await expect(page.getByText("Nothing here")).toBeVisible();
  await mine.close();
});

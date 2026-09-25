import { expect, test } from "@playwright/test";

import { priya } from "./people";

/**
 * Notes pages (#408), end to end: the seeded pages arrive over the live
 * socket, a line typed through the `/` menu lands, and a page made from the
 * list can be archived and brought back.
 */
test.use({ storageState: priya.state });

test("a member writes on a page and keeps the page list", async ({ page }) => {
  await page.goto("/trips");
  await page.getByText("Portugal, late summer").click();
  await expect(page).toHaveURL(/\/trip\/\d+/);
  const trip = new URL(page.url()).pathname.match(/\/trip\/\d+/)![0];

  await page.goto(`${trip}/notes`);
  const list = page.getByRole("list", { name: "Pages" });
  await expect(list.getByRole("button", { name: "Where to eat", exact: true })).toBeVisible();
  await expect(page.getByText("Portugal, eight days.")).toBeVisible();
  await expect(page.getByText("Live", { exact: true })).toBeVisible();

  const editor = page.getByLabel("Page", { exact: true });
  await editor.getByRole("heading", { name: "Ideas" }).click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await page.getByRole("option", { name: /Heading 2/ }).click();
  await page.keyboard.type("Day trips");
  await expect(editor.getByRole("heading", { name: "Day trips" })).toBeVisible();

  await page.getByRole("button", { name: "New page" }).click();
  const name = page.getByLabel("Page name");
  await expect(name).toBeFocused();
  await name.fill("Sintra");
  await page.keyboard.press("Enter");
  await expect(list.getByRole("button", { name: "Sintra", exact: true })).toBeVisible();

  await list.getByRole("button", { name: "Sintra", exact: true }).hover();
  await list.getByRole("button", { name: "Sintra menu" }).click();
  await page.getByRole("menu").getByRole("button", { name: "Archive" }).click();
  await expect(list.getByRole("button", { name: "Sintra", exact: true })).toBeHidden();
  await page.getByRole("button", { name: /Archived/ }).click();
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(list.getByRole("button", { name: "Sintra", exact: true })).toBeVisible();
});

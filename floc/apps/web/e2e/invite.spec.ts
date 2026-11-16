import { expect, test } from "@playwright/test";

import { priya } from "./people";

test("a member shares the trip, and a stranger gives a name to answer, seeing nothing of the group", async ({
  browser,
}) => {
  const members = await browser.newContext({
    storageState: priya.state,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const memberPage = await members.newPage();

  const welcome = memberPage.getByRole("dialog", { name: "Welcome to Floc" });
  await memberPage.addLocatorHandler(welcome, async () => {
    await welcome.getByRole("button", { name: "Skip" }).click();
  });

  await memberPage.goto("/trips");
  await memberPage.getByText("Portugal, late summer").click();
  await expect(memberPage).toHaveURL(/\/trip\/\d+/);

  await memberPage.getByRole("button", { name: "Invite", exact: true }).click();
  await memberPage.getByRole("button", { name: /^Copy (invite )?link$/ }).click();
  const url: string = await memberPage.evaluate(() =>
    navigator.clipboard.readText(),
  );
  await members.close();

  expect(url).toContain("/invite/");

  const strangers = await browser.newContext();
  const page = await strangers.newPage();
  await page.goto(url);

  const gate = page.getByRole("dialog");
  await expect(gate.getByRole("link", { name: "Sign up" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(gate).toBeVisible();
  await gate.getByLabel("Your name").fill("Robin");
  await gate.getByRole("button", { name: "Continue" }).click();
  await expect(gate).toBeHidden();

  await expect(page.getByRole("heading", { name: "Your dates" })).toBeVisible();
  await expect(page.getByText("Answering as Robin.")).toBeVisible();
  await expect(page.getByText("Flight to Lisbon")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Files" })).toHaveCount(0);

  await expect(page.getByText("Airbnb, three nights in Lisbon")).toHaveCount(0);
  await expect(page.getByText("Spending")).toHaveCount(0);
  await expect(page.getByText("Tom Whitfield")).toHaveCount(0);
  await expect(page.getByText("Priya is on the same flight")).toHaveCount(0);

  await page.goto("/invite/not-a-real-token");
  await expect(page.getByText("This link no longer works")).toBeVisible();

  await strangers.close();
});

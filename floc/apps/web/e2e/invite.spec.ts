import { expect, test } from "@playwright/test";

import { priya } from "./people";

/**
 * The share link seen by somebody who is not on the trip (#330), end to end
 * and signed out.
 *
 * This is a privacy boundary rather than a feature: what matters is not that
 * the page renders but that a stranger holding a forwardable URL reaches the
 * days and nothing else. The unit tests hold the reads; this holds the page,
 * where a component spreading the wrong props is what would leak.
 */
test("a member shares the trip, and a stranger sees the days but not the group", async ({
  browser,
}) => {
  const members = await browser.newContext({
    storageState: priya.state,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const memberPage = await members.newPage();

  await memberPage.goto("/trips");
  await memberPage.getByText("Portugal, late summer").click();
  await expect(memberPage).toHaveURL(/\/trip\/\d+/);

  // The first-trip tour covers the page with its own backdrop, and a fresh e2e
  // database means this account has never seen it. It is shown once, ever, so
  // it is waited for rather than guessed at.
  const tour = memberPage.getByRole("dialog", { name: "A quick tour" });
  await expect(tour).toBeVisible();
  await tour.getByRole("button", { name: "Skip" }).click();
  await expect(tour).toBeHidden();

  // The URL is never drawn on the page — the button copies it.
  await memberPage.getByRole("button", { name: "Share trip" }).click();
  const url: string = await memberPage.evaluate(() =>
    navigator.clipboard.readText(),
  );
  await members.close();

  expect(url).toContain("/invite/");

  // A brand-new context: no cookie, no account, nothing but the link.
  const strangers = await browser.newContext();
  const page = await strangers.newPage();
  await page.goto(url);

  // The ask comes first, over the trip rather than instead of it. Scoped to the
  // dialog: the bar above the page carries the same control, deliberately.
  const gate = page.getByRole("dialog");
  await expect(gate.getByRole("link", { name: "Sign up to join" })).toBeVisible();
  await gate.getByRole("button", { name: "Just have a look first" }).click();
  await expect(gate).toBeHidden();

  await expect(page.getByText("The trip, day by day")).toBeVisible();
  await expect(page.getByText("Flight to Lisbon").first()).toBeVisible();
  await expect(page.getByText("Lagos, Portugal").first()).toBeVisible();

  // The group's own business. Each of these is on the member's version of this
  // trip; none may be on a stranger's.
  await expect(page.getByText("Airbnb, three nights in Lisbon")).toHaveCount(0);
  await expect(page.getByText("Spending")).toHaveCount(0);
  await expect(page.getByText("Tom Whitfield")).toHaveCount(0);
  // An event's free-text note is the group talking to itself — dropped by the
  // guest projection, so it is absent even though its event is shown above.
  await expect(page.getByText("Priya is on the same flight")).toHaveCount(0);

  // Files renders as itself, and offers no way into one.
  await page.goto(`${url}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect(page.getByRole("link", { name: /\./ })).toHaveCount(0);

  // A token that was never real says so, and says nothing else.
  await page.goto("/invite/not-a-real-token");
  await expect(page.getByText("This link no longer works")).toBeVisible();

  await strangers.close();
});

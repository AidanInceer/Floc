import { expect, it } from "vitest";

import { fakeRailway, webVariables } from "./fake-railway";
import { readPlan } from "./plan";

it("sorts deployed secrets into what the tool rotates, what is unused and what it leaves", async () => {
  const { railway } = fakeRailway(webVariables({ RESEND_API_KEY: "re_x" }));
  const plan = await readPlan(railway);
  expect(plan.pasted).toEqual(["GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  expect(plan.turso).toBe(true);
  expect(plan.unused).toEqual(["NEXT_PUBLIC_MAPTILER_KEY"]);
  expect(plan.other).toEqual(["RESEND_API_KEY"]);
  expect(plan.cronFollowsWeb).toBe(false);
});

it("sees a cron secret that references floc-web", async () => {
  const { railway } = fakeRailway(webVariables(), { BETTER_AUTH_URL: "https://floc.live", CRON_SECRET: "${{floc-web.CRON_SECRET}}" });
  expect((await readPlan(railway)).cronFollowsWeb).toBe(true);
});

it("refuses a handled secret that is a variable reference", async () => {
  const { railway } = fakeRailway(webVariables({ TURSO_AUTH_TOKEN: "${{shared.TURSO_AUTH_TOKEN}}" }));
  await expect(readPlan(railway)).rejects.toThrow("TURSO_AUTH_TOKEN on floc-web is a variable reference");
});

it("refuses a target whose origin is not floc.live", async () => {
  const { railway } = fakeRailway(webVariables({ BETTER_AUTH_URL: "http://localhost:3000" }));
  await expect(readPlan(railway)).rejects.toThrow("BETTER_AUTH_URL");
});

it("refuses when an application secret is missing", async () => {
  const { railway } = fakeRailway(webVariables({ CRON_SECRET: "" }));
  await expect(readPlan(railway)).rejects.toThrow("CRON_SECRET is missing");
});

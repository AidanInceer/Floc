import { expect, it, vi } from "vitest";

import { applyRotation } from "./apply";
import { fakeRailway, webVariables } from "./fake-railway";
import type { Turso } from "./turso";

const endpoints = '{"data":[{"url":"https://floc.live/api/billing/webhook","status":"enabled"}]}';
const ok = () => vi.fn<typeof fetch>().mockImplementation(async (url) => String(url).includes("webhook_endpoints")
  ? new Response(endpoints)
  : String(url).includes("stripe.com") ? new Response('{"id":"acct_a"}')
  : String(url).includes("googleapis") ? new Response('{"error":"invalid_grant"}', { status: 400 }) : new Response("ok"));
const turso = (): Turso => ({ assertScope: vi.fn(async () => {}), replaceToken: vi.fn(async () => "new-turso") });
const wait = async () => {};

it("writes every new value, then redeploys both services once and checks the site", async () => {
  const { railway } = fakeRailway();
  const supplied = { turso: turso(), GOOGLE_CLIENT_SECRET: "GOCSPX-new", STRIPE_SECRET_KEY: "sk_live_new", STRIPE_WEBHOOK_SECRET: "whsec_new" };
  const rotated = await applyRotation(supplied, { railway, fetcher: ok(), wait });
  expect(rotated).toEqual(["BETTER_AUTH_SECRET", "CRON_SECRET", "GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "TURSO_AUTH_TOKEN"]);
  const web = railway.upsert.mock.calls.filter(([id]) => id === "web").map(([, values]) => values);
  expect(Object.assign({}, ...web)).toMatchObject({ GOOGLE_CLIENT_SECRET: "GOCSPX-new", STRIPE_SECRET_KEY: "sk_live_new", TURSO_AUTH_TOKEN: "new-turso" });
  expect(web[0].BETTER_AUTH_SECRET).not.toBe("old-auth");
  expect(railway.upsert).toHaveBeenCalledWith("cron", { CRON_SECRET: web[0].CRON_SECRET });
  expect(railway.deploy.mock.calls.map(([id]) => id)).toEqual(["web", "cron"]);
});

it("changes nothing when a pasted value fails its check", async () => {
  const { railway } = fakeRailway();
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"error":"invalid_client"}', { status: 401 }));
  await expect(applyRotation({ GOOGLE_CLIENT_SECRET: "wrong" }, { railway, fetcher, wait })).rejects.toThrow("Google");
  expect(railway.upsert).not.toHaveBeenCalled();
});

it("leaves Turso alone and skips pasted values the operator did not give", async () => {
  const { railway } = fakeRailway();
  expect(await applyRotation({}, { railway, fetcher: ok(), wait })).toEqual(["BETTER_AUTH_SECRET", "CRON_SECRET"]);
  expect(Object.keys(railway.upsert.mock.calls[0][1]).sort()).toEqual(["BETTER_AUTH_SECRET", "CRON_SECRET"]);
});

it("leaves a cron secret that follows floc-web untouched", async () => {
  const { railway } = fakeRailway(webVariables(), { BETTER_AUTH_URL: "https://floc.live", CRON_SECRET: "${{floc-web.CRON_SECRET}}" });
  await applyRotation({}, { railway, fetcher: ok(), wait });
  expect(railway.upsert.mock.calls.some(([id]) => id === "cron")).toBe(false);
  expect(railway.deploy).toHaveBeenCalledWith("cron");
});

it("reports each step in order, deploy statuses as they change, and a skipped Turso step", async () => {
  const { railway, statuses } = fakeRailway();
  statuses.push("BUILDING", "BUILDING", "SUCCESS");
  const events: string[] = [];
  await applyRotation({}, { railway, fetcher: ok(), wait, progress: (event) => events.push(`${event.step}:${event.state}${event.detail ? `:${event.detail}` : ""}`) });
  expect(events).toEqual([
    "0:start", "0:done", "1:start", "1:done", "2:done:skipped",
    "3:start", "3:status:BUILDING", "3:status:SUCCESS", "3:done",
    "4:start", "4:status:SUCCESS", "4:done", "5:start", "5:done",
  ]);
});

it("waits through a building deploy and stops on a failed one", async () => {
  const { railway, statuses } = fakeRailway();
  statuses.push("BUILDING", "DEPLOYING", "SUCCESS", "FAILED");
  await expect(applyRotation({}, { railway, fetcher: ok(), wait })).rejects.toThrow("Deploy ended FAILED");
  expect(railway.status).toHaveBeenCalledTimes(4);
});

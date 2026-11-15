import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { encodeConsent } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

import { db } from "@/db";
import { analyticsEvent } from "@/db/schema";
import { migrateTestDb, resetDb } from "@/test/db";

import { receiveEvent } from "./analytics-handler";

beforeAll(migrateTestDb);
beforeEach(resetDb);

const post = (body: string, consent?: { functional: boolean; analytics: boolean }) =>
  new Request("http://floc.test/api/analytics", {
    method: "POST",
    body,
    headers: consent ? { cookie: `other=1; floc_consent=${encodeConsent(consent, today())}` } : {},
  });

const view = JSON.stringify({ name: "page.view", path: "/trip/7/days" });
const routes = async () => (await db.select().from(analyticsEvent).all()).map((r) => `${r.surface} ${r.route}`);

describe("the page-view door", () => {
  it("counts a view from a browser that said yes to analytics", async () => {
    expect((await receiveEvent(post(view, { functional: false, analytics: true }))).status).toBe(204);
    expect(await routes()).toEqual(["web /trip/[id]/days"]);
  });

  it("counts nothing with no choice, or a no, and gives the same answer", async () => {
    expect((await receiveEvent(post(view))).status).toBe(204);
    expect((await receiveEvent(post(view, { functional: true, analytics: false }))).status).toBe(204);
    expect(await routes()).toEqual([]);
  });

  it("counts nothing for a body that is not an event, or is too large", async () => {
    const yes = { functional: false, analytics: true };
    await receiveEvent(post("not json", yes));
    await receiveEvent(post(JSON.stringify({ name: "page.view", path: `/${"x".repeat(5000)}` }), yes));
    expect(await routes()).toEqual([]);
  });
});

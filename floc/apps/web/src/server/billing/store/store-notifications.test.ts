import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { readAppStoreNotification } from "@/server/billing/store/app-store";
import { isPubSubPush, readPlaySubscription } from "@/server/billing/store/play";
import { recordStoreSubscription } from "@/server/billing/store/store-record";
import type { StoreFacts } from "@/server/billing/store/store-facts";
import {
  applyAppStoreNotification,
  applyPlayNotification,
} from "@/server/billing/store/store-notifications";

vi.mock("@/server/billing/store/app-store", () => ({ readAppStoreNotification: vi.fn() }));
vi.mock("@/server/billing/store/play", () => ({
  isPubSubPush: vi.fn(),
  readPlaySubscription: vi.fn(),
}));

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  vi.mocked(readAppStoreNotification).mockReset();
  vi.mocked(readPlaySubscription).mockReset();
  vi.mocked(isPubSubPush).mockReset().mockResolvedValue(true);
});

const facts = (over: Partial<StoreFacts> = {}): StoreFacts => ({
  storeTransactionId: "orig-1",
  productId: "floc_pro_yearly",
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
  cancelAtPeriodEnd: false,
  accountToken: null,
  ...over,
});

const row = (id: string) =>
  db.select().from(schema.subscription).where(eq(schema.subscription.storeTransactionId, id)).get();

const push = (message: unknown) => ({
  message: { data: Buffer.from(JSON.stringify(message)).toString("base64") },
});

describe("an App Store notification", () => {
  it("updates a purchase somebody claimed", async () => {
    await recordStoreSubscription({ userId: world.admin, source: "app_store", facts: facts() });
    vi.mocked(readAppStoreNotification).mockResolvedValue(facts({ status: "canceled" }));

    expect(await applyAppStoreNotification({ signedPayload: "jws" })).toBe(200);
    expect((await row("orig-1"))?.status).toBe("canceled");
  });

  it("writes nothing for a purchase nobody has claimed yet — the claim will", async () => {
    vi.mocked(readAppStoreNotification).mockResolvedValue(facts());

    expect(await applyAppStoreNotification({ signedPayload: "jws" })).toBe(200);
    expect(await row("orig-1")).toBeUndefined();
  });

  it("answers 200 to what it ignores, so Apple stops retrying", async () => {
    vi.mocked(readAppStoreNotification).mockResolvedValue("ignored");
    expect(await applyAppStoreNotification({ signedPayload: "jws" })).toBe(200);
  });

  it("refuses a body with no signed payload, and one Apple did not sign", async () => {
    expect(await applyAppStoreNotification({})).toBe(400);
    vi.mocked(readAppStoreNotification).mockResolvedValue("refused");
    expect(await applyAppStoreNotification({ signedPayload: "forged" })).toBe(400);
  });

  it("asks Apple to retry while it cannot check", async () => {
    vi.mocked(readAppStoreNotification).mockResolvedValue("unavailable");
    expect(await applyAppStoreNotification({ signedPayload: "jws" })).toBe(503);
  });
});

describe("a Play notification", () => {
  const renewal = push({ subscriptionNotification: { purchaseToken: "orig-1" } });

  it("refuses a push that is not from our Pub/Sub account", async () => {
    vi.mocked(isPubSubPush).mockResolvedValue(false);
    expect(await applyPlayNotification(null, renewal)).toBe(401);
    expect(readPlaySubscription).not.toHaveBeenCalled();
  });

  it("updates a purchase somebody claimed", async () => {
    await recordStoreSubscription({ userId: world.admin, source: "play", facts: facts() });
    vi.mocked(readPlaySubscription).mockResolvedValue({
      facts: facts({ cancelAtPeriodEnd: true }),
      replaces: null,
    });

    expect(await applyPlayNotification("Bearer t", renewal)).toBe(200);
    expect((await row("orig-1"))?.cancelAtPeriodEnd).toBe(true);
  });

  it("follows an upgrade to the account that held the old purchase", async () => {
    await recordStoreSubscription({
      userId: world.member,
      source: "play",
      facts: facts({ storeTransactionId: "old" }),
    });
    vi.mocked(readPlaySubscription).mockResolvedValue({
      facts: facts({ storeTransactionId: "new" }),
      replaces: "old",
    });

    const upgraded = push({ subscriptionNotification: { purchaseToken: "new" } });
    expect(await applyPlayNotification("Bearer t", upgraded)).toBe(200);
    expect((await row("new"))?.userId).toBe(world.member);
    expect((await row("old"))?.status).toBe("canceled");
  });

  it("writes nothing for a purchase nobody has claimed yet", async () => {
    vi.mocked(readPlaySubscription).mockResolvedValue({ facts: facts(), replaces: null });
    expect(await applyPlayNotification("Bearer t", renewal)).toBe(200);
    expect(await row("orig-1")).toBeUndefined();
  });

  it("answers 200 to a test ping and to a body it cannot read", async () => {
    expect(await applyPlayNotification("Bearer t", push({ testNotification: {} }))).toBe(200);
    expect(await applyPlayNotification("Bearer t", { message: { data: "not json" } })).toBe(200);
    expect(await applyPlayNotification("Bearer t", null)).toBe(200);
  });

  it("answers 200 to a token Google refuses, and 503 while Google is down", async () => {
    vi.mocked(readPlaySubscription).mockResolvedValueOnce("refused");
    expect(await applyPlayNotification("Bearer t", renewal)).toBe(200);

    vi.mocked(readPlaySubscription).mockResolvedValueOnce("unavailable");
    expect(await applyPlayNotification("Bearer t", renewal)).toBe(503);
  });
});

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { canUseFeature } from "@/server/billing/entitlements";
import { accountTokenFor } from "@/server/billing/store/account-token";
import { readPlaySubscription } from "@/server/billing/store/play";
import { claimStorePurchase } from "@/server/billing/store/store-claim";
import type { StoreFacts } from "@/server/billing/store/store-facts";
import { verifyAppStoreTransaction } from "@/server/billing/store/app-store";

vi.mock("@/server/billing/store/app-store", () => ({ verifyAppStoreTransaction: vi.fn() }));
vi.mock("@/server/billing/store/play", () => ({ readPlaySubscription: vi.fn() }));

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  vi.mocked(verifyAppStoreTransaction).mockReset();
  vi.mocked(readPlaySubscription).mockReset();
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

const ios = { platform: "ios" as const, productId: "floc_pro_yearly", token: "jws" };
const android = { platform: "android" as const, productId: "floc_pro_yearly", token: "purchase" };
const pro = () => canUseFeature("dates.weather", world.ours.id);

describe("claiming an App Store purchase", () => {
  it("records a receipt Apple vouches for", async () => {
    vi.mocked(verifyAppStoreTransaction).mockResolvedValue(
      facts({ accountToken: accountTokenFor(world.admin) }),
    );

    expect(await claimStorePurchase(world.admin, ios)).toBe("recorded");
    expect(verifyAppStoreTransaction).toHaveBeenCalledWith("jws");
    expect(await pro()).toBe(true);
  });

  it("refuses a receipt made out to another account", async () => {
    vi.mocked(verifyAppStoreTransaction).mockResolvedValue(
      facts({ accountToken: accountTokenFor(world.outsider) }),
    );

    expect(await claimStorePurchase(world.admin, ios)).toBe("refused");
    expect(await pro()).toBe(false);
  });

  it("passes on Apple's refusal and Apple being unreachable", async () => {
    vi.mocked(verifyAppStoreTransaction).mockResolvedValueOnce("refused");
    expect(await claimStorePurchase(world.admin, ios)).toBe("refused");

    vi.mocked(verifyAppStoreTransaction).mockResolvedValueOnce("unavailable");
    expect(await claimStorePurchase(world.admin, ios)).toBe("unavailable");
  });
});

describe("claiming a Play purchase", () => {
  it("records a purchase Google vouches for", async () => {
    vi.mocked(readPlaySubscription).mockResolvedValue({ facts: facts(), replaces: null });

    expect(await claimStorePurchase(world.admin, android)).toBe("recorded");
    expect(readPlaySubscription).toHaveBeenCalledWith("purchase");
    expect(await pro()).toBe(true);
  });

  it("passes on Google's refusal", async () => {
    vi.mocked(readPlaySubscription).mockResolvedValue("refused");
    expect(await claimStorePurchase(world.admin, android)).toBe("refused");
  });
});

describe("what a claim never trusts", () => {
  it("refuses a product Floc does not sell, before asking any store", async () => {
    expect(await claimStorePurchase(world.admin, { ...ios, productId: "coins_100" })).toBe(
      "refused",
    );
    expect(verifyAppStoreTransaction).not.toHaveBeenCalled();
  });

  it("refuses a receipt for a different product than the one named", async () => {
    vi.mocked(verifyAppStoreTransaction).mockResolvedValue(facts({ productId: "floc_pro_monthly" }));
    expect(await claimStorePurchase(world.admin, ios)).toBe("refused");
  });

  it("refuses a purchase another account already claimed", async () => {
    vi.mocked(verifyAppStoreTransaction).mockResolvedValue(facts());
    await claimStorePurchase(world.admin, ios);

    expect(await claimStorePurchase(world.outsider, ios)).toBe("refused");
  });
});

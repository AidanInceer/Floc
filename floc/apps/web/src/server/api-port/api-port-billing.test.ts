import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the forecast through the port", () => {
  it("says a free trip is locked", async () => {
    expect(await webPort.loadTripForecast(world.member, world.ours.id)).toEqual({
      locked: true,
      forecast: null,
    });
  });

  it("unlocks once anybody on the trip is Pro", async () => {
    await givePro(world.admin);
    expect((await webPort.loadTripForecast(world.member, world.ours.id)).locked).toBe(false);
  });

  it("refuses a trip the viewer is not on", async () => {
    await expect(webPort.loadTripForecast(world.outsider, world.ours.id)).rejects.toThrow();
  });
});

describe("billing through the port", () => {
  it("reads the caller's own record", async () => {
    await givePro(world.member);
    const status = await webPort.loadBillingStatus(world.member);
    expect(status.subscription?.source).toBe("comp");
  });

  it("refuses a claim for a product Floc does not sell", async () => {
    expect(
      await webPort.claimStorePurchase(world.member, {
        platform: "ios",
        productId: "coins_100",
        token: "jws",
      }),
    ).toBe("refused");
  });
});

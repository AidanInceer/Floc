/**
 * Route tracking (#329, ADR-026): a member records only with their switch on, only inside the trip's
 * dates, and the group sees each route and, while the trip runs, a live dot.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { trip } from "@/db/schema";
import { findTripAccess, type TripAccess } from "@/server/access";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { deleteMyRoute, recordPositions } from "./route-positions";
import { groupRoutes } from "./group-routes";
import { routeSwitch, setRouteOn } from "./route-switch";

const NOW = Date.UTC(2026, 8, 3, 12, 0);
const TODAY = "2026-09-03";
const at = (minutesAgo: number, date = TODAY) => ({ lat: 41 + minutesAgo / 8, lng: 12.5, date, recordedAt: NOW - minutesAgo * 60_000 });

let world: Scenario;
const access = async (userId: string) => (await findTripAccess(world.ours.id, userId)) as TripAccess;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.update(trip).set({ startDate: "2026-09-01", endDate: "2026-09-07" }).where(eq(trip.id, world.ours.id));
});

describe("the switch", () => {
  it("starts off, and is each member's own", async () => {
    await setRouteOn(await access(world.member), true);
    expect(await routeSwitch(await access(world.member), TODAY)).toEqual({ on: true, underway: true });
    expect(await routeSwitch(await access(world.admin), TODAY)).toEqual({ on: false, underway: true });
  });

  it("says when the trip is not under way, so the phone does not record", async () => {
    expect((await routeSwitch(await access(world.member), "2026-09-08")).underway).toBe(false);
  });
});

describe("recording", () => {
  it("keeps nothing while the switch is off", async () => {
    expect(await recordPositions(await access(world.member), [at(5)], NOW)).toBe(0);
  });

  it("keeps positions on trip days, and a re-sent one only once", async () => {
    const me = await access(world.member);
    await setRouteOn(me, true);
    expect(await recordPositions(me, [at(10), at(5), at(1, "2026-09-08")], NOW)).toBe(2);
    expect(await recordPositions(me, [at(5)], NOW)).toBe(0);
  });
});

describe("what the group sees", () => {
  async function track() {
    const me = await access(world.member);
    await setRouteOn(me, true);
    await recordPositions(me, [at(10), at(4)], NOW);
  }

  it("each member's route in time order, and the newest as a live dot while the trip runs", async () => {
    await track();
    const [route] = await groupRoutes(await access(world.admin), TODAY);
    expect(route.userId).toBe(world.member);
    expect(route.path).toEqual([[12.5, 42.25], [12.5, 41.5]]);
    expect(route.live).toEqual({ lat: 41.5, lng: 12.5, recordedAt: NOW - 4 * 60_000 });
  });

  it("keeps the route but drops the dot once the trip has ended", async () => {
    await track();
    const [route] = await groupRoutes(await access(world.admin), "2026-09-08");
    expect(route.path).toHaveLength(2);
    expect(route.live).toBeNull();
  });

  it("shows another trip nothing", async () => {
    await track();
    expect(await groupRoutes((await findTripAccess(world.theirs.id, world.outsider)) as TripAccess, TODAY)).toEqual([]);
  });

  it("a member's deleted route is gone for everyone", async () => {
    await track();
    await deleteMyRoute(await access(world.member));
    expect(await groupRoutes(await access(world.admin), TODAY)).toEqual([]);
  });
});

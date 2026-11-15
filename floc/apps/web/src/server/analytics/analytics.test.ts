import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { analyticsEvent } from "@/db/schema";
import { migrateTestDb, resetDb } from "@/test/db";

import { purgeOldAnalytics, recordEvent } from "./analytics";

const yes = { functional: false, analytics: true };
const view = { name: "page.view", surface: "web" as const, path: "/trip/12/money?tab=owed" };

beforeAll(migrateTestDb);
beforeEach(resetDb);

const rows = () => db.select().from(analyticsEvent).all();

describe("counting a page view", () => {
  it("keeps the event, the surface and the route, with no id from the path", async () => {
    expect(await recordEvent(view, yes)).toBe(true);
    const [row] = await rows();
    expect(row).toMatchObject({ name: "page.view", surface: "web", route: "/trip/[id]/money", props: null });
    expect(Object.keys(row).sort()).toEqual(["createdAt", "id", "name", "props", "route", "surface"]);
  });

  it("keeps nothing without a yes to analytics", async () => {
    expect(await recordEvent(view, null)).toBe(false);
    expect(await recordEvent(view, { functional: true, analytics: false })).toBe(false);
    expect(await rows()).toEqual([]);
  });

  it("keeps nothing for an event or a surface it does not know", async () => {
    expect(await recordEvent({ ...view, name: "made.up" }, yes)).toBe(false);
    expect(await recordEvent({ ...view, surface: "fridge" as never }, yes)).toBe(false);
    expect(await recordEvent({ ...view, path: 12 as never }, yes)).toBe(false);
    expect(await rows()).toEqual([]);
  });

  it("deletes rows older than a year and keeps the rest", async () => {
    const now = new Date("2026-11-15T12:00:00Z");
    await db.insert(analyticsEvent).values([
      { name: "page.view", surface: "web", route: "/trips", createdAt: new Date("2025-11-14T12:00:00Z") },
      { name: "page.view", surface: "web", route: "/trips", createdAt: new Date("2025-11-16T12:00:00Z") },
    ]);
    expect(await purgeOldAnalytics(now)).toBe(1);
    expect((await rows()).map((r) => r.createdAt.toISOString())).toEqual(["2025-11-16T12:00:00.000Z"]);
  });
});

import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb } from "@/test/db";
import { devAccountEmail } from "@/server/auth/dev-accounts";
import { walkthroughDue } from "@/server/auth/tour";
import { findGuest, listGuests } from "@/server/guests/guests";
import { findTripByShareLink } from "@/server/trips/invites";
import { isLiveMember } from "@/server/trips/roster";

import { isSeedEmail } from "../identity.ts";
import { buildScenarioA } from "../scenario-a.ts";
import { buildScenarioB } from "../scenario-b.ts";
import { STARTS, buildStart, enterPath } from "./starts.ts";

async function tripNamed(name: string) {
  const row = await db.select().from(schema.trip).where(eq(schema.trip.name, name)).get();
  if (!row) throw new Error(`no trip ${name}`);
  return row;
}

const tokenIn = (to: string) => to.replace("/invite/", "");

beforeAll(migrateTestDb);
beforeEach(async () => {
  process.env.FLOC_DEV_USER_EMAIL = "dev@example.test";
  process.env.FLOC_DEV_USER_PASSWORD = "dev-password";
  await resetDb();
  await buildScenarioA();
  await buildScenarioB();
}, 60_000);

describe("dev starts", () => {
  it("names the six starts", () => {
    expect(STARTS).toEqual(["new-user", "walkthrough", "join-link", "guest-account", "dead-link"]);
  });

  it("builds the dev link for a start", () => {
    expect(enterPath({ as: null, to: "/signup" })).toBe("/api/dev/enter?to=%2Fsignup");
    expect(enterPath({ as: "dev-user", to: "/profile" })).toBe("/api/dev/enter?to=%2Fprofile&as=dev-user");
  });

  it("new-user: signed out on the sign-up page", async () => {
    expect(await buildStart("new-user")).toEqual({ as: null, to: "/signup" });
  });

  it("walkthrough: a fresh account on its first trip's Overview, walkthrough due", async () => {
    const start = await buildStart("walkthrough");
    const tripId = Number(start.to.match(/^\/trip\/(\d+)\/overview$/)?.[1]);
    expect(start.as).not.toBeNull();
    expect(await isLiveMember(tripId, start.as!)).toBe(true);
    expect(await walkthroughDue(start.as!)).toBe(true);
    expect(isSeedEmail((await devAccountEmail(start.as!))!)).toBe(true);
  });

  it("join-link: signed out on Portugal's invite link, with ideas to vote on", async () => {
    const start = await buildStart("join-link");
    const portugal = await tripNamed("Portugal, late summer");
    expect(start.as).toBeNull();
    expect((await findTripByShareLink(tokenIn(start.to)))?.id).toBe(portugal.id);
    const ideas = await db.select().from(schema.idea).where(eq(schema.idea.tripId, portugal.id)).all();
    expect(ideas.length).toBeGreaterThan(0);
  });

  it("guest-account: guest Sam with answers on Portugal, on its invite page", async () => {
    const start = await buildStart("guest-account");
    const portugal = await tripNamed("Portugal, late summer");
    expect((await findTripByShareLink(tokenIn(start.to)))?.id).toBe(portugal.id);
    expect(await findGuest(start.as!)).toEqual({ id: start.as, name: "Sam" });
    expect((await listGuests(portugal.id)).map((g) => g.name)).toEqual(["Sam"]);
    const marks = await db.select().from(schema.availability).where(eq(schema.availability.userId, start.as!)).all();
    expect(marks.length).toBeGreaterThan(0);
    expect(isSeedEmail((await devAccountEmail(start.as!))!)).toBe(true);
  });

  it("dead-link: signed out on an invite link the admin has reset", async () => {
    const start = await buildStart("dead-link");
    expect(start.as).toBeNull();
    expect(start.to.startsWith("/invite/")).toBe(true);
    expect(await findTripByShareLink(tokenIn(start.to))).toBeFalsy();
  });
});

/**
 * #442: a guest on an invite link holds a real session, but the door treats it
 * as signed out — every page and action behind `requireUser` and
 * `requireTripAccess` answers a guest as it answers nobody (rule 5).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { REDIRECT } from "@/test/setup";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { findTripAccess, getInviteGuest, getSession, requireTripAccess, requireUser } from "@/server/access";

let world: Scenario;
const GUEST = "g-sam";

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.user).values({ id: GUEST, name: "Sam", email: "g@guest.test", isAnonymous: true });
});

describe("a guest session at the door", () => {
  it("reads as signed out", async () => {
    signIn(GUEST);
    expect(await getSession()).toBeNull();
    await expect(requireUser("/trips")).rejects.toThrow(`${REDIRECT}:/login?redirect=%2Ftrips`);
  });

  it("cannot open a trip, even one it somehow holds a membership row on", async () => {
    await db.insert(schema.tripMembership).values({ tripId: world.ours.id, userId: GUEST });
    signIn(GUEST);
    await expect(requireTripAccess(world.ours.id)).rejects.toThrow(REDIRECT);
    expect(await findTripAccess(world.ours.id, GUEST)).toBeNull();
  });

  it("is found as a guest, and a member is not", async () => {
    signIn(GUEST);
    expect(await getInviteGuest()).toEqual({ id: GUEST, name: "Sam" });
    signIn(world.member);
    expect(await getInviteGuest()).toBeNull();
    await expectNotFound(() => requireTripAccess(world.theirs.id));
  });
});

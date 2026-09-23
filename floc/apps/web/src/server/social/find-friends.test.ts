/**
 * Finding someone to befriend (#360). Mo is the viewer, a friend of Ada; Sam
 * is Ada's friend and nobody else's, so reachable only through Ada. Ozz is a
 * stranger on a trip of his own — the one nothing here may reveal.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { findByName, mayAskToBeFriends } from "@/server/social/find-friends";
import { findByCode, friendCodeFor, requestByCode } from "@/server/social/friend-code";
import { searchFriends } from "@/server/social/friend-search";
import { listFriendshipsFor, splitFriendships } from "@/server/social/friends";

let world: Scenario;
const sam = "u-sam";

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.user).values({ id: sam, name: "Sam", email: "sam@example.test" });
  await befriend(world.admin, world.member);
  await befriend(world.admin, sam);
});

async function befriend(a: string, b: string) {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  await db
    .insert(schema.friendship)
    .values({ userId: lo, friendId: hi, status: "accepted", origin: "request" });
}

async function setProfile(userId: string, patch: Partial<typeof schema.userProfile.$inferInsert>) {
  await db
    .insert(schema.userProfile)
    .values({ userId, ...patch })
    .onConflictDoUpdate({ target: schema.userProfile.userId, set: patch });
}

const liveRowsBetween = (a: string, b: string) =>
  db
    .select()
    .from(schema.friendship)
    .where(
      and(
        eq(schema.friendship.userId, a),
        eq(schema.friendship.friendId, b),
      ),
    )
    .all();

describe("findByName", () => {
  it("finds a friend of a friend whose profile is public", async () => {
    const found = await findByName(world.member, "sa");
    expect(found.map((p) => [p.name, p.state])).toEqual([["Sam", "none"]]);
  });

  it("leaves out a friend of a friend whose profile is private", async () => {
    await setProfile(sam, { isPrivate: true });
    expect(await findByName(world.member, "sam")).toEqual([]);
  });

  it("leaves out friends of a friend who keeps that list private", async () => {
    await setProfile(world.admin, { visibilityFriends: "private" });
    expect(await findByName(world.member, "sam")).toEqual([]);
  });

  it("never finds a stranger, however well the name matches", async () => {
    expect(await findByName(world.member, "Ozz")).toEqual([]);
  });

  it("finds someone you share a trip with, private or not", async () => {
    await db.delete(schema.friendship);
    await setProfile(world.admin, { isPrivate: true });
    const found = await findByName(world.member, "ADA");
    expect(found.map((p) => [p.name, p.state])).toEqual([["Ada", "none"]]);
  });

  it("marks someone already a friend as such", async () => {
    const found = await findByName(world.member, "ada");
    expect(found.map((p) => [p.name, p.state])).toEqual([["Ada", "friends"]]);
  });

  it("matches the display name, and takes % as a letter, not a wildcard", async () => {
    await setProfile(sam, { displayName: "Samira" });
    expect((await findByName(world.member, "mira")).map((p) => p.name)).toEqual(["Samira"]);
    expect(await findByName(world.member, "%")).toEqual([]);
  });

  it("never finds the viewer", async () => {
    expect(await findByName(world.member, "Mo")).toEqual([]);
  });
});

describe("mayAskToBeFriends", () => {
  it("lets you ask a public friend of a friend", async () => {
    expect(await mayAskToBeFriends(world.member, sam)).toBe(true);
  });

  it("refuses a private friend of a friend, and a stranger", async () => {
    expect(await mayAskToBeFriends(world.member, world.outsider)).toBe(false);
    await setProfile(sam, { isPrivate: true });
    expect(await mayAskToBeFriends(world.member, sam)).toBe(false);
  });

  it("lets you ask someone you share a trip with", async () => {
    await db.delete(schema.friendship);
    expect(await mayAskToBeFriends(world.member, world.admin)).toBe(true);
  });
});

describe("friend codes", () => {
  it("gives a person one code and keeps it", async () => {
    const code = await friendCodeFor(world.outsider);
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(await friendCodeFor(world.outsider)).toBe(code);
  });

  it("finds a stranger by their code and asks them", async () => {
    const code = await friendCodeFor(world.outsider);
    const found = await requestByCode(world.member, code);

    expect(found?.name).toBe("Ozz");
    const [row] = await liveRowsBetween(world.member, world.outsider);
    expect(row).toMatchObject({ status: "pending", origin: "code" });
    const mine = splitFriendships(await listFriendshipsFor(world.member), world.member);
    expect(mine.outgoing.map((r) => r.friendId)).toEqual([world.outsider]);
  });

  it("names the holder of a code without asking them anything", async () => {
    const code = await friendCodeFor(world.outsider);
    expect(await findByCode(world.member, code)).toMatchObject({ name: "Ozz", state: "none" });
    expect(await db.select().from(schema.friendship).all()).toHaveLength(2);
  });

  it("finds nobody by a code nobody holds", async () => {
    expect(await requestByCode(world.member, "AAAA-2222")).toBeNull();
  });

  it("names someone already a friend, but asks nothing", async () => {
    const code = await friendCodeFor(world.admin);
    expect((await requestByCode(world.member, code))?.name).toBe("Ada");
    expect(await db.select().from(schema.friendship).all()).toHaveLength(2);
  });

  it("finds nobody by your own code", async () => {
    expect(await requestByCode(world.member, await friendCodeFor(world.member))).toBeNull();
  });
});

describe("searchFriends", () => {
  it("searches names among the people you can reach", async () => {
    expect(await searchFriends(world.member, "sam")).toEqual({
      kind: "people",
      people: [{ id: sam, name: "Sam", avatarIcon: null, state: "none" }],
    });
  });

  it("never looks anybody up by email address", async () => {
    expect(await searchFriends(world.member, "u-outsider@example.test")).toEqual({
      kind: "invalid",
    });
  });

  it("looks a code up without asking", async () => {
    const code = await friendCodeFor(world.outsider);
    const found = await searchFriends(world.member, code.toLowerCase());
    expect(found).toMatchObject({ kind: "code", code, person: { name: "Ozz" } });
    expect(await db.select().from(schema.friendship).all()).toHaveLength(2);
  });

  it("says a query is too short to search", async () => {
    expect(await searchFriends(world.member, "s")).toEqual({ kind: "invalid" });
  });
});

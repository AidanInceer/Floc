import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { canSee, requireProfileView, showsAttribute } from "@/server/auth/visibility";
import { setTripSaved } from "@/server/explore/explore-saves";
import { befriend, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

describe("canSee", () => {
  it("lets a stranger see nothing, whatever the flag", () => {
    expect(canSee(null, "trip_members")).toBe(false);
    expect(canSee(null, "friends")).toBe(false);
    expect(canSee(null, "private")).toBe(false);
  });

  it("nests the rings — a friend is inside trip_members too", () => {
    expect(canSee("friend", "trip_members")).toBe(true);
    expect(canSee("friend", "friends")).toBe(true);
    expect(canSee("friend", "private")).toBe(false);
  });

  it("keeps a co-traveller out of the friends ring", () => {
    expect(canSee("co_traveller", "trip_members")).toBe(true);
    expect(canSee("co_traveller", "friends")).toBe(false);
  });

  it("shows you everything of your own", () => {
    expect(canSee("self", "private")).toBe(true);
  });
});

describe("showsAttribute", () => {
  it("hides every display attribute once the profile is private", () => {
    expect(showsAttribute("friend", "trip_members", true)).toBe(false);
    expect(showsAttribute("co_traveller", "trip_members", true)).toBe(false);
  });

  it("exempts you from your own private switch", () => {
    expect(showsAttribute("self", "private", true)).toBe(true);
  });

  it("falls through to the flag when the profile isn't private", () => {
    expect(showsAttribute("co_traveller", "friends", false)).toBe(false);
    expect(showsAttribute("friend", "friends", false)).toBe(true);
  });
});

describe("a profile's Saved list (#544)", () => {
  let world: Scenario;

  beforeAll(migrateTestDb);
  beforeEach(async () => {
    await resetDb();
    world = await seedScenario();
    await setTripSaved(world.admin, "porto-to-seville", true);
  });

  async function ring(
    visibilitySaved: "private" | "friends" | "trip_members",
    isPrivate = false,
  ): Promise<void> {
    await db.insert(schema.userProfile).values({ userId: world.admin, visibilitySaved, isPrivate });
  }

  async function savedSeenBy(viewerId: string): Promise<string[] | null> {
    return (await requireProfileView(world.admin, viewerId)).saved;
  }

  it("is hidden from a co-traveller by default", async () => {
    expect(await savedSeenBy(world.member)).toBeNull();
  });

  it("always shows to its owner", async () => {
    expect(await savedSeenBy(world.admin)).toEqual(["porto-to-seville"]);
  });

  it("shows to a friend, not a co-traveller, on the friends ring", async () => {
    await ring("friends");
    await befriend(world.admin, world.outsider);

    expect(await savedSeenBy(world.member)).toBeNull();
    expect(await savedSeenBy(world.outsider)).toEqual(["porto-to-seville"]);
  });

  it("shows to a co-traveller on the trip members ring", async () => {
    await ring("trip_members");

    expect(await savedSeenBy(world.member)).toEqual(["porto-to-seville"]);
  });

  it("hides from a friend when the whole profile is private", async () => {
    await ring("trip_members", true);
    await befriend(world.admin, world.outsider);

    expect(await savedSeenBy(world.outsider)).toBeNull();
  });
});

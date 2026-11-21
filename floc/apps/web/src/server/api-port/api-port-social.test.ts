import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { mintShareToken, readShareToken } from "@/server/trips/invite-link";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("finding someone to ask", () => {
  async function befriend(a: string, b: string) {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    await db
      .insert(schema.friendship)
      .values({ userId: lo, friendId: hi, status: "accepted", origin: "request" });
  }

  it("lets you ask a public friend of a friend found by name", async () => {
    await befriend(world.admin, world.member);
    await befriend(world.admin, world.outsider);

    const found = await webPort.findFriends(world.member, "ozz");
    expect(found).toMatchObject({ kind: "people", people: [{ id: world.outsider }] });

    await webPort.requestFriend(world.member, world.outsider);
    expect((await webPort.loadFriends(world.outsider)).incoming.map((p) => p.id)).toEqual([
      world.member,
    ]);
  });

  it("asks by code, and the sender sees who they asked", async () => {
    const { code } = await webPort.loadFriends(world.outsider);
    await webPort.requestFriendByCode(world.member, code);
    expect((await webPort.loadFriends(world.member)).outgoing.map((p) => p.id)).toEqual([
      world.outsider,
    ]);
  });
});

describe("someone else's profile (rule 5, applied to people)", () => {
  it("shows a co-traveller their fellow member", async () => {
    const seen = await webPort.loadProfileOf(world.member, world.admin);
    expect(seen?.name).toBe("Ada");
    expect(seen?.relation).toBe("co_traveller");
  });

  it("answers a stranger and a nonexistent id identically", async () => {
    const stranger = await webPort.loadProfileOf(world.outsider, world.admin);
    const missing = await webPort.loadProfileOf(world.outsider, "u-nobody");
    expect(stranger).toBeNull();
    expect(missing).toBeNull();
  });

  it("sends you elsewhere for your own face", async () => {
    expect(await webPort.loadProfileOf(world.admin, world.admin)).toBeNull();
  });
});

describe("friend requests (ticket 46)", () => {
  it("opens one to somebody inside a ring, and the other end sees it", async () => {
    await webPort.requestFriend(world.member, world.admin);

    const mine = await webPort.loadFriends(world.member);
    const theirs = await webPort.loadFriends(world.admin);
    expect(mine.outgoing.map((p) => p.id)).toEqual([world.admin]);
    expect(theirs.incoming.map((p) => p.id)).toEqual([world.member]);
  });

  it("ignores one aimed at somebody outside every ring", async () => {
    await webPort.requestFriend(world.outsider, world.admin);
    expect((await webPort.loadFriends(world.admin)).incoming).toEqual([]);
  });

  it("accepting moves the pair into both friends lists", async () => {
    await webPort.requestFriend(world.member, world.admin);
    await webPort.acceptFriend(world.admin, world.member);

    expect((await webPort.loadFriends(world.member)).friends.map((p) => p.id)).toEqual([
      world.admin,
    ]);
    expect((await webPort.loadFriends(world.admin)).friends.map((p) => p.id)).toEqual([
      world.member,
    ]);
  });

  it("declining leaves nobody in any list", async () => {
    await webPort.requestFriend(world.member, world.admin);
    await webPort.declineFriend(world.admin, world.member);

    const after = await webPort.loadFriends(world.admin);
    expect(after.incoming).toEqual([]);
    expect(after.friends).toEqual([]);
  });
});

describe("inviting (#312, ticket 146)", () => {
  it("gives a member the invite panel", async () => {
    const panel = await webPort.loadTripInvites(world.member, world.ours.id);
    expect(readShareToken(panel.token)).toBe("token-ours");
  });

  it("refuses somebody not on the trip the panel and the invite", async () => {
    await expect(webPort.loadTripInvites(world.outsider, world.ours.id)).rejects.toThrow();
    await expect(
      webPort.inviteToTrip(world.outsider, world.ours.id, [world.member]),
    ).rejects.toThrow();
  });

  it("gives an admin the share token, never the trip id", async () => {
    const panel = await webPort.loadTripInvites(world.admin, world.ours.id);
    expect(readShareToken(panel.token)).toBe("token-ours");
    expect(panel.token.split(".")).not.toContain(String(world.ours.id));
  });

  it("offers only accepted friends, and never one already on the roster", async () => {
    await webPort.requestFriend(world.admin, world.member);
    await webPort.acceptFriend(world.member, world.admin);

    const panel = await webPort.loadTripInvites(world.admin, world.ours.id);
    expect(panel.candidates).toEqual([]);
  });

  it("puts an invite on the invitee's list, and accepting joins them", async () => {
    await db.insert(schema.tripMembership).values({
      tripId: world.theirs.id,
      userId: world.admin,
      role: "member",
    });
    await webPort.requestFriend(world.admin, world.outsider);
    await webPort.acceptFriend(world.outsider, world.admin);

    expect(await webPort.inviteToTrip(world.admin, world.ours.id, [world.outsider])).toBe(1);

    const waiting = await webPort.listMyInvites(world.outsider);
    expect(waiting.map((i) => i.tripName)).toEqual(["Ours"]);
    expect(waiting[0].fromName).toBe("Ada");

    await webPort.acceptTripInvite(world.outsider, world.ours.id);
    expect((await webPort.loadTrip(world.outsider, world.ours.id))?.name).toBe("Ours");
  });
});

describe("the share link (ticket 05, 147)", () => {
  it("reads without a viewer, and carries nothing a member owns", async () => {
    const preview = await webPort.previewInvite(mintShareToken("token-ours"));
    expect(preview?.name).toBe("Ours");
    expect(preview?.hostName).toBe("Ada");
    expect(Object.keys(preview ?? {}).sort()).toEqual([
      "endDate",
      "hostName",
      "name",
      "startDate",
    ]);
  });

  it("answers null for a token that is not one", async () => {
    expect(await webPort.previewInvite("not-a-token")).toBeNull();
  });
});

describe("the welcome through the port (#707)", () => {
  it("is due until finished, then saves the answers", async () => {
    expect((await webPort.welcome(world.member)).due).toBe(true);
    await webPort.finishWelcome(world.member, { homeAirport: "LIS", vibeTags: ["museums"] });
    const after = await webPort.welcome(world.member);
    expect(after.due).toBe(false);
    expect(after.answers).toMatchObject({ homeAirport: "LIS", vibeTags: ["museums"] });
  });
});

describe("deleting a trip (rule 6, rule 8)", () => {
  it("refuses a member", async () => {
    await expect(webPort.deleteTrip(world.member, world.ours.id)).rejects.toThrow();
  });

  it("lets an admin, and the trip stops existing for everybody", async () => {
    await webPort.deleteTrip(world.admin, world.ours.id);
    expect(await webPort.loadTrip(world.admin, world.ours.id)).toBeNull();
    expect(await webPort.loadTrip(world.member, world.ours.id)).toBeNull();
    expect(await webPort.listTrips(world.member, { archived: false })).toEqual([]);
  });
});

describe("groups through the port (#545)", () => {
  it("creates a group of a co-traveller and reads it back", async () => {
    const id = await webPort.createGroup(world.admin, { name: "Uni lot", memberIds: [world.member] });
    expect(await webPort.loadGroups(world.admin)).toMatchObject([
      { id, name: "Uni lot", members: [{ id: world.member, name: "Mo" }] },
    ]);
  });

  it("refuses a stranger, so a group is no backdoor to anyone", async () => {
    await expect(
      webPort.createGroup(world.admin, { name: "Nope", memberIds: [world.outsider] }),
    ).rejects.toThrow("You can only add friends and people on a trip with you.");
  });

  it("hides a deleted group, and only its maker sees one", async () => {
    const id = await webPort.createGroup(world.admin, { name: "Uni lot", memberIds: [world.member] });
    expect(await webPort.loadGroups(world.member)).toEqual([]);
    await webPort.deleteGroup(world.admin, id);
    expect(await webPort.loadGroups(world.admin)).toEqual([]);
  });

  it("lists an ended trip with its people", async () => {
    await db
      .update(schema.trip)
      .set({ startDate: "2026-02-01", endDate: "2026-02-05" })
      .where(eq(schema.trip.id, world.ours.id));
    expect(await webPort.loadPastTripPeople(world.admin)).toMatchObject([
      { id: world.ours.id, name: "Ours", people: [{ id: world.member }] },
    ]);
  });
});

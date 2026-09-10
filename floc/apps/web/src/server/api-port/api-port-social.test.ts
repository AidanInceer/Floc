/**
 * The social half of the port, against a real database (tickets 18, 46, 146).
 *
 * The point of these is not that the queries work — `friends.test.ts` and
 * `invites.test.ts` already prove that. It is that the *same rules* survive
 * the new door the phone comes through. Three of them cannot be checked by
 * reading the code, because they are about what is NOT returned:
 *
 *   rule 5, applied to people — a stranger's profile and an id that was never
 *   an account must answer identically, or this becomes a way to find out who
 *   has a Floc account (ticket 46);
 *   rule 6 — inviting is one of the four admin powers, and the phone must not
 *   be the client that forgot;
 *   ticket 146 — only accepted friends may be offered, else a trip invite is
 *   a backdoor friend request.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

/** Two people who share a trip are co-travellers, which is a ring (ticket 46). */
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
    // `me.profile` owns this one, and it is writable where the other is not.
    expect(await webPort.loadProfileOf(world.admin, world.admin)).toBeNull();
  });
});

describe("friend requests (ticket 46)", () => {
  it("opens one to somebody inside a ring, and the other end sees it", async () => {
    await webPort.requestFriend(world.member, world.admin);

    const mine = await webPort.loadFriends(world.member);
    const theirs = await webPort.loadFriends(world.admin);
    expect(mine.outgoing.map((p) => p.id)).toEqual([world.admin]);
    // The same row, read from the other end — never merged into one list.
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

describe("inviting (rule 6, ticket 146)", () => {
  it("refuses a member the invite panel and the invite itself", async () => {
    await expect(webPort.loadTripInvites(world.member, world.ours.id)).rejects.toThrow();
    await expect(
      webPort.inviteToTrip(world.member, world.ours.id, [world.outsider]),
    ).rejects.toThrow();
  });

  it("gives an admin the share token, never the trip id", async () => {
    const panel = await webPort.loadTripInvites(world.admin, world.ours.id);
    expect(panel.token).toBe("token-ours");
    expect(panel.token).not.toContain(String(world.ours.id));
  });

  it("offers only accepted friends, and never one already on the roster", async () => {
    // Ada and Mo share the trip, so Mo is a candidate on relation alone —
    // except that he is already a member, which is the stronger filter.
    await webPort.requestFriend(world.admin, world.member);
    await webPort.acceptFriend(world.member, world.admin);

    const panel = await webPort.loadTripInvites(world.admin, world.ours.id);
    expect(panel.candidates).toEqual([]);
  });

  it("puts an invite on the invitee's list, and accepting joins them", async () => {
    // Ozz has to be a friend before he can be asked (ticket 146), and a shared
    // trip is what makes that request legal in the first place.
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
    const preview = await webPort.previewInvite("token-ours");
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

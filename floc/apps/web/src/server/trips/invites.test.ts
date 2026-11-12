/**
 * Invites (tickets 05, 146; split out of membership.test.ts by ticket 242).
 * The rules worth failing on: an invite must not be a membership, re-inviting
 * must land on the row a decline left behind, an invite to a trip nobody can
 * open must stop asking, and accepting must be one operation — a join that
 * skipped `settleInvite` would keep badging a trip you are already on.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario, befriend } from "@/test/db";
import {
  acceptInvite,
  countPendingInvitesFor,
  declineInvite,
  findPendingInvite,
  findTripByInviteToken,
  findTripByShareLink,
  inviteToTrip,
  joinWithLink,
  listDeclinedInvitees,
  listPendingInvitees,
  listPendingInvitesFor,
} from "@/server/trips/invites";
import { countMembers, removeMembership } from "@/server/trips/roster";
import { resetInviteToken, setTripArchived, softDeleteTrip } from "@/server/trips/trips";
import { mintShareToken } from "@/server/trips/invite-link";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await befriend(world.admin, world.outsider);
  await befriend(world.outsider, world.member);
});

const membership = (tripId: number, userId: string) =>
  db
    .select()
    .from(schema.tripMembership)
    .where(
      and(
        eq(schema.tripMembership.tripId, tripId),
        eq(schema.tripMembership.userId, userId),
      ),
    )
    .get();

const invitesFor = (tripId: number) =>
  db
    .select()
    .from(schema.tripInvite)
    .where(eq(schema.tripInvite.tripId, tripId))
    .all();

const ask = (toUserIds: string[], fromUserId = world.admin) =>
  inviteToTrip({ tripId: world.ours.id, fromUserId, toUserIds });

describe("the share link", () => {
  it("resolves a live trip", async () => {
    expect((await findTripByInviteToken("token-ours"))?.id).toBe(world.ours.id);
  });

  it("resolves nothing once the trip is archived", async () => {
    await setTripArchived(world.ours.id, true);
    expect(await findTripByInviteToken("token-ours")).toBeUndefined();
  });

  it("opens the trip for a week from when it was shared, and not after (ADR-047)", async () => {
    const shared = Date.UTC(2027, 0, 10);
    const link = mintShareToken("token-ours", shared);
    const day = 24 * 60 * 60 * 1000;
    expect((await findTripByShareLink(link, shared + 6 * day))?.id).toBe(world.ours.id);
    expect(await findTripByShareLink(link, shared + 8 * day)).toBeUndefined();
  });

  it("stops working when an admin resets the link, whatever its date", async () => {
    const link = mintShareToken("token-ours");
    await resetInviteToken(world.ours.id);
    expect(await findTripByShareLink(link)).toBeUndefined();
  });

  it("lets nobody else in once the trip is full", async () => {
    const extra = Array.from({ length: 98 }, (_, i) => `u-extra-${i}`);
    await db.insert(schema.user).values(extra.map((id) => ({ id, name: id, email: `${id}@example.test` })));
    await db.insert(schema.tripMembership).values(extra.map((userId) => ({ tripId: world.ours.id, userId })));

    await expect(joinWithLink(world.ours.id, world.outsider)).rejects.toThrow("This trip is full.");
    expect(await countMembers(world.ours.id)).toBe(100);
  });
});

describe("asking someone by name", () => {
  it("opens one pending invite per friend and grants nothing", async () => {
    expect(await ask([world.outsider])).toBe(1);

    expect((await invitesFor(world.ours.id)).map((i) => i.status)).toEqual([
      "pending",
    ]);
    expect(await membership(world.ours.id, world.outsider)).toBeUndefined(); // being invited is not being in
    expect(await countMembers(world.ours.id)).toBe(2);
  });

  it("asks nobody who is not a friend", async () => {
    await db.delete(schema.friendship);
    expect(await ask([world.outsider])).toBe(0);
    expect(await invitesFor(world.ours.id)).toEqual([]);
  });

  describe("someone on a trip with you who is not a friend (#545)", () => {
    const askOntoNext = async (toUserId: string) => {
      const next = await db
        .insert(schema.trip)
        .values({ name: "Next", createdBy: world.admin, inviteToken: "t-next" })
        .returning({ id: schema.trip.id })
        .get();
      await db.insert(schema.tripMembership).values({ tripId: next.id, userId: world.admin, role: "admin" });
      return inviteToTrip({ tripId: next.id, fromUserId: world.admin, toUserIds: [toUserId] });
    };

    it("is asked while the trip you share is live", async () => {
      expect(await askOntoNext(world.member)).toBe(1);
    });

    it("is not asked once the trip you share is deleted", async () => {
      await softDeleteTrip(world.ours.id);
      expect(await askOntoNext(world.member)).toBe(0);
    });

    it("is not asked once they are off the trip you share", async () => {
      await removeMembership(world.ours.id, world.member, world.admin);
      expect(await askOntoNext(world.member)).toBe(0);
    });
  });

  it("never asks a guest, even a friend (ADR-029)", async () => {
    await db.insert(schema.user).values({ id: "u-guest", name: "Guest", email: "u-guest@example.test", isAnonymous: true });
    await befriend(world.admin, "u-guest");
    expect(await ask(["u-guest"])).toBe(0);
  });

  it("skips people already on the roster, and yourself", async () => {
    const n = await ask([world.admin, world.member, world.outsider, world.outsider]);
    expect(n).toBe(1);
    expect(await invitesFor(world.ours.id)).toHaveLength(1);
  });

  it("re-invites onto the declined row rather than a second one", async () => {
    await ask([world.outsider]);
    await declineInvite(world.ours.id, world.outsider);
    expect(await listPendingInvitesFor(world.outsider)).toEqual([]);

    // Different member asking this time — the invite records who asked now.
    await ask([world.outsider], world.member);

    const rows = await invitesFor(world.ours.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].fromUserId).toBe(world.member);
  });

  it("names the trip and whoever asked, and counts what's waiting", async () => {
    await ask([world.outsider]);

    const [invite] = await listPendingInvitesFor(world.outsider);
    expect(invite.tripName).toBe("Ours");
    expect(invite.fromName).toBe("Ada");
    expect(await countPendingInvitesFor(world.outsider)).toBe(1);

    expect((await listPendingInvitees(world.ours.id)).map((p) => p.name)).toEqual([
      "Ozz",
    ]);
  });

  it("stops asking once the trip is archived or deleted", async () => {
    await ask([world.outsider]);

    await setTripArchived(world.ours.id, true);
    expect(await listPendingInvitesFor(world.outsider)).toEqual([]);
    expect(await countPendingInvitesFor(world.outsider)).toBe(0);

    await setTripArchived(world.ours.id, false);
    expect(await countPendingInvitesFor(world.outsider)).toBe(1);

    await softDeleteTrip(world.ours.id);
    expect(await countPendingInvitesFor(world.outsider)).toBe(0);
  });

  it("lists who said no until they are asked again", async () => {
    await ask([world.outsider]);
    expect(await listDeclinedInvitees(world.ours.id)).toEqual([]);

    await declineInvite(world.ours.id, world.outsider);
    expect((await listDeclinedInvitees(world.ours.id)).map((p) => p.name)).toEqual(["Ozz"]);

    await ask([world.outsider]);
    expect(await listDeclinedInvitees(world.ours.id)).toEqual([]);
  });

  it("is a no-op with nobody to invite", async () => {
    expect(await ask([])).toBe(0);
    expect(await invitesFor(world.ours.id)).toHaveLength(0);
  });
});

describe("answering", () => {
  it("joins and closes the invite in one operation", async () => {
    await ask([world.outsider]);
    expect(await findPendingInvite(world.ours.id, world.outsider)).toBeDefined();

    expect(await acceptInvite(world.ours.id, world.outsider)).toBe(true);

    expect(await membership(world.ours.id, world.outsider)).toBeDefined();
    expect(await findPendingInvite(world.ours.id, world.outsider)).toBeUndefined();
    expect(await listPendingInvitees(world.ours.id)).toEqual([]);
  });

  it("grants nothing on a trip you were never asked to (rule 5)", async () => {
    expect(await acceptInvite(world.ours.id, world.outsider)).toBe(false);
    expect(await membership(world.ours.id, world.outsider)).toBeUndefined();
  });

  it("declining closes the invite and joins nothing", async () => {
    await ask([world.outsider]);
    await declineInvite(world.ours.id, world.outsider);

    expect(await findPendingInvite(world.ours.id, world.outsider)).toBeUndefined();
    expect(await membership(world.ours.id, world.outsider)).toBeUndefined();
    expect((await invitesFor(world.ours.id))[0].status).toBe("declined");
  });

  it("answers a name invite too when the link is what got used", async () => {
    await ask([world.outsider]);
    await joinWithLink(world.ours.id, world.outsider);

    expect(await membership(world.ours.id, world.outsider)).toBeDefined();
    // Left pending, this would keep badging the chrome for a trip they are on.
    expect(await countPendingInvitesFor(world.outsider)).toBe(0);
  });

  it("revives a kicked member's row rather than colliding on the unique key", async () => {
    await removeMembership(world.ours.id, world.member, world.member);
    await joinWithLink(world.ours.id, world.member);

    const row = await membership(world.ours.id, world.member);
    expect(row?.deletedAt).toBeNull();
    expect(row?.mapPromptAt).toBeNull(); // rejoining makes the travel-map question moot (ticket 95)
  });

  it("records no second join for someone already on the trip", async () => {
    const joins = () =>
      db
        .select()
        .from(schema.activity)
        .where(eq(schema.activity.kind, "member_joined"))
        .all();
    const before = (await joins()).length;

    await joinWithLink(world.ours.id, world.member);

    expect(await joins()).toHaveLength(before);
  });

  it("gives whoever walked in a profile", async () => {
    await joinWithLink(world.ours.id, world.outsider);
    const profile = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, world.outsider))
      .get();
    expect(profile).toBeDefined();
  });
});

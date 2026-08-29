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
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  acceptInvite,
  countPendingInvitesFor,
  declineInvite,
  findPendingInvite,
  findTripByInviteToken,
  inviteToTrip,
  joinWithLink,
  listPendingInvitees,
  listPendingInvitesFor,
} from "@/server/invites";
import { countMembers, removeMembership } from "@/server/roster";
import { setTripArchived, softDeleteTrip } from "@/server/trips";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
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
    await removeMembership(world.ours.id, world.member);
    await joinWithLink(world.ours.id, world.member);

    const row = await membership(world.ours.id, world.member);
    expect(row?.deletedAt).toBeNull();
    expect(row?.mapPromptAt).toBeNull(); // rejoining makes the travel-map question moot (ticket 95)
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

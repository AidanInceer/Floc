/**
 * The reads ticket 118 moved off nine `page.tsx` files and into the
 * aggregates. Each is checked against a scenario with a second, disjoint
 * trip, for the two ways a hand-written join goes quietly wrong: rule 5 (no
 * cross-trip leakage) and rule 8 (soft-deleted rows stay gone).
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  countIdeas,
  listIdeaIds,
  listIdeas,
  listVotes,
  tripIdsWithIdeas,
} from "@/server/ideas";
import {
  firstOvernightPlaceByTrip,
  listDaysWithEvents,
  listRouteDays,
  transportModesByDay,
} from "@/server/itinerary";
import {
  countMembers,
  findTripByInviteToken,
  isLiveMember,
  listAvailability,
  listTripsFor,
} from "@/server/membership";
import { listExpenses, listSplits, namesForUsers } from "@/server/money";
import { listFriendshipsFor, peopleByIds } from "@/server/friends";
import { listLinkedAccounts } from "@/server/profile";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function makePlace(name: string, lat?: number, lng?: number) {
  const row = await db
    .insert(schema.place)
    .values({ name, lat: lat ?? null, lng: lng ?? null })
    .returning({ id: schema.place.id })
    .get();
  return row.id;
}

async function makeExpense(
  tripId: number,
  paidBy: string,
  amountMinor: number,
  owedBy: string[],
) {
  const row = await db
    .insert(schema.expense)
    .values({
      tripId,
      createdBy: paidBy,
      paidBy,
      description: "Dinner",
      amountMinor,
      currency: "GBP",
      splitType: "shares",
    })
    .returning({ id: schema.expense.id })
    .get();

  const each = Math.floor(amountMinor / owedBy.length);
  await db.insert(schema.expenseSplit).values(
    owedBy.map((userId, i) => ({
      expenseId: row.id,
      userId,
      owedAmountMinor: i === 0 ? amountMinor - each * (owedBy.length - 1) : each,
    })),
  );
  return row.id;
}

describe("the ideas board's reads", () => {
  it("returns the trip's own ideas, with the author already on them", async () => {
    const ideas = await listIdeas(world.ours.id);

    expect(ideas.map((i) => i.id)).toEqual([world.ours.ideaId]);
    expect(ideas[0].authorName).toBe("Ada"); // the author join is the point of the aggregate
    expect(await listIdeaIds(world.theirs.id)).toEqual([world.theirs.ideaId]);
  });

  it("drops a soft-deleted idea from every shape of the read", async () => {
    await db
      .update(schema.idea)
      .set({ deletedAt: new Date() })
      .where(eq(schema.idea.id, world.ours.ideaId));

    expect(await listIdeas(world.ours.id)).toEqual([]);
    expect(await listIdeaIds(world.ours.id)).toEqual([]);
    expect(await countIdeas(world.ours.id)).toBe(0);
    expect(await tripIdsWithIdeas([world.ours.id])).toEqual(new Set());
  });

  it("scopes votes through the idea, so another trip's never arrive", async () => {
    await db.insert(schema.ideaVote).values([
      { ideaId: world.ours.ideaId, userId: world.admin, value: "up" },
      { ideaId: world.theirs.ideaId, userId: world.outsider, value: "up" },
    ]);

    const votes = await listVotes(world.ours.id);
    expect(votes).toHaveLength(1);
    expect(votes[0].ideaId).toBe(world.ours.ideaId);
    expect(votes[0].name).toBe("Ada"); // voter may have since left the trip, so the roster can't answer this
  });

  it("drops a cleared vote, and a vote on a deleted idea", async () => {
    await db.insert(schema.ideaVote).values({
      ideaId: world.ours.ideaId,
      userId: world.admin,
      value: "up",
    });
    await db
      .update(schema.ideaVote)
      .set({ deletedAt: new Date() })
      .where(eq(schema.ideaVote.ideaId, world.ours.ideaId));
    expect(await listVotes(world.ours.id)).toEqual([]);

    await db
      .update(schema.ideaVote)
      .set({ deletedAt: null })
      .where(eq(schema.ideaVote.ideaId, world.ours.ideaId));
    await db
      .update(schema.idea)
      .set({ deletedAt: new Date() })
      .where(eq(schema.idea.id, world.ours.ideaId));
    expect(await listVotes(world.ours.id)).toEqual([]);
  });

  it("answers the trip list's probe for the whole list in one read", async () => {
    expect(await tripIdsWithIdeas([world.ours.id, world.theirs.id])).toEqual(
      new Set([world.ours.id, world.theirs.id]),
    );
    expect(await tripIdsWithIdeas([])).toEqual(new Set());
  });
});

describe("the itinerary's reads", () => {
  it("attaches each day's own events, in timeline order", async () => {
    const days = await listDaysWithEvents(world.ours.id);

    expect(days).toHaveLength(1);
    expect(days[0].events.map((e) => e.time)).toEqual(["09:00", "19:00"]); // time decides order, not order_index
    expect(days[0].events.every((e) => e.dayId === world.ours.dayId)).toBe(true);
  });

  it("never lets another trip's events onto a day", async () => {
    const theirs = await listDaysWithEvents(world.theirs.id);
    const ourEventIds = new Set([world.ours.eventId, world.ours.lateEventId]);

    expect(
      theirs.flatMap((d) => d.events).some((e) => ourEventIds.has(e.id)),
    ).toBe(false);
  });

  it("drops a soft-deleted event, and a soft-deleted day with it", async () => {
    await db
      .update(schema.dayEvent)
      .set({ deletedAt: new Date() })
      .where(eq(schema.dayEvent.id, world.ours.eventId));
    expect((await listDaysWithEvents(world.ours.id))[0].events).toHaveLength(1);

    await db
      .update(schema.day)
      .set({ deletedAt: new Date() })
      .where(eq(schema.day.id, world.ours.dayId));
    expect(await listDaysWithEvents(world.ours.id)).toEqual([]);
    expect(await listRouteDays(world.ours.id)).toEqual([]);
  });

  it("carries the overnight place and its coordinates onto the route", async () => {
    const placeId = await makePlace("Lisbon", 38.72, -9.14);
    await db
      .update(schema.day)
      .set({ overnightPlaceId: placeId })
      .where(eq(schema.day.id, world.ours.dayId));

    const [day] = await listRouteDays(world.ours.id);
    expect(day.placeName).toBe("Lisbon");
    expect(day.lat).toBe(38.72);
  });

  it("takes the first transport event of a day as its leg's mode", async () => {
    await db.insert(schema.dayEvent).values([
      {
        dayId: world.ours.dayId,
        type: "transport" as const,
        title: "Taxi",
        transportType: "car" as const,
        orderIndex: 2,
      },
      {
        dayId: world.ours.dayId,
        type: "transport" as const,
        title: "Ferry",
        transportType: "ferry" as const,
        orderIndex: 3,
      },
    ]);

    const modes = await transportModesByDay(world.ours.id);
    expect(modes.get(world.ours.dayId)).toBe("car");
    expect(await transportModesByDay(world.theirs.id)).toEqual(new Map());
  });

  it("derives where each trip is from its earliest overnight place", async () => {
    const lisbon = await makePlace("Lisbon");
    const lagos = await makePlace("Lagos");

    await db
      .update(schema.day)
      .set({ overnightPlaceId: lagos })
      .where(eq(schema.day.id, world.ours.dayId));
    await db.insert(schema.day).values({
      tripId: world.ours.id,
      date: "2026-08-30", // earlier than seeded
      overnightPlaceId: lisbon,
    });

    const where = await firstOvernightPlaceByTrip([world.ours.id]);
    expect(where.get(world.ours.id)).toBe("Lisbon");
    expect(await firstOvernightPlaceByTrip([])).toEqual(new Map());
  });
});

describe("the money tab's reads", () => {
  it("returns the trip's ledger newest first, and only its own", async () => {
    const older = await makeExpense(world.ours.id, world.admin, 1000, [
      world.admin,
      world.member,
    ]);
    const newer = await makeExpense(world.ours.id, world.member, 2000, [
      world.admin,
    ]);
    await makeExpense(world.theirs.id, world.outsider, 5000, [world.outsider]);

    const rows = await listExpenses(world.ours.id);
    expect(rows.map((e) => e.id)).toEqual(
      expect.arrayContaining([older, newer]),
    );
    expect(rows).toHaveLength(2);
  });

  it("scopes splits through the expense, and hides a deleted expense's", async () => {
    const ours = await makeExpense(world.ours.id, world.admin, 1000, [
      world.admin,
      world.member,
    ]);
    await makeExpense(world.theirs.id, world.outsider, 5000, [world.outsider]);

    let splits = await listSplits(world.ours.id);
    expect(splits).toHaveLength(2);
    expect(splits.every((s) => s.expenseId === ours)).toBe(true);
    expect(splits.reduce((a, s) => a + s.owedAmountMinor, 0)).toBe(1000); // snapshot rows sum to the original total (rule 2)

    // Bug the join closed: an unfiltered inArray read let a deleted expense's splits count into balances.
    await db
      .update(schema.expense)
      .set({ deletedAt: new Date() })
      .where(eq(schema.expense.id, ours));
    splits = await listSplits(world.ours.id);
    expect(splits).toEqual([]);
  });

  it("names a participant the roster can no longer name", async () => {
    const names = await namesForUsers([world.outsider]);
    expect(names).toEqual([{ id: world.outsider, name: "Ozz" }]);
    expect(await namesForUsers([])).toEqual([]);
  });
});

describe("the trip lists and the invite teaser", () => {
  it("splits live from archived on the one predicate", async () => {
    expect(
      (await listTripsFor(world.admin, { archived: false })).map((t) => t.id),
    ).toEqual([world.ours.id]);
    expect(await listTripsFor(world.admin, { archived: true })).toEqual([]);

    await db
      .update(schema.trip)
      .set({ archivedAt: new Date() })
      .where(eq(schema.trip.id, world.ours.id));

    expect(await listTripsFor(world.admin, { archived: false })).toEqual([]);
    expect(
      (await listTripsFor(world.admin, { archived: true })).map((t) => t.id),
    ).toEqual([world.ours.id]);
  });

  it("never lists a trip the viewer has left", async () => {
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(eq(schema.tripMembership.userId, world.member));

    expect(await listTripsFor(world.member, { archived: false })).toEqual([]);
    expect(await countMembers(world.ours.id)).toBe(1); // roster count drops with them
  });

  it("resolves an invite token to the fields the teaser may show", async () => {
    const found = await findTripByInviteToken("token-ours");
    // Host name joined on in ticket 147, no email/id, so the link says who's planning it.
    expect(found).toEqual({
      id: world.ours.id,
      name: "Ours",
      startDate: null,
      endDate: null,
      hostName: "Ada",
    });
    expect(await findTripByInviteToken("token-nope")).toBeUndefined();
  });

  it("hides a deleted trip behind its own invite link", async () => {
    await db
      .update(schema.trip)
      .set({ deletedAt: new Date() })
      .where(eq(schema.trip.id, world.ours.id));

    expect(await findTripByInviteToken("token-ours")).toBeUndefined();
  });

  it("answers the teaser's already-a-member check per person", async () => {
    expect(await isLiveMember(world.ours.id, world.admin)).toBe(true);
    expect(await isLiveMember(world.ours.id, world.outsider)).toBe(false);
  });
});

describe("the dates grid's read", () => {
  it("returns both answers, because 'no' and 'not looked' differ", async () => {
    await db.insert(schema.availability).values([
      {
        tripId: world.ours.id,
        userId: world.admin,
        date: "2026-09-01",
        available: true,
      },
      {
        tripId: world.ours.id,
        userId: world.member,
        date: "2026-09-01",
        available: false,
      },
      {
        tripId: world.theirs.id,
        userId: world.outsider,
        date: "2026-09-01",
        available: true,
      },
    ]);

    const rows = await listAvailability(world.ours.id);
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.available)).toHaveLength(1);
    expect(rows.some((r) => r.userId === world.outsider)).toBe(false);
  });
});

describe("the friends page's reads", () => {
  it("returns both directions of a friendship in one read", async () => {
    await db.insert(schema.friendship).values([
      { userId: world.admin, friendId: world.member, status: "accepted" },
      { userId: world.outsider, friendId: world.admin, status: "pending" },
    ]);

    const rows = await listFriendshipsFor(world.admin);
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.friendId === world.admin)).toHaveLength(1); // which end you're at tells incoming from outgoing
    expect(await listFriendshipsFor(world.member)).toHaveLength(1);
  });

  it("drops a removed friendship", async () => {
    await db.insert(schema.friendship).values({
      userId: world.admin,
      friendId: world.member,
      status: "accepted",
    });
    await db.update(schema.friendship).set({ deletedAt: new Date() });

    expect(await listFriendshipsFor(world.admin)).toEqual([]);
  });

  it("resolves every face in one query, preferring the display name", async () => {
    await db.insert(schema.userProfile).values({
      userId: world.member,
      displayName: "Mo the Elder",
    });

    const people = await peopleByIds([world.admin, world.member, world.member]);
    expect(people.size).toBe(2);
    expect(people.get(world.admin)?.name).toBe("Ada");
    expect(people.get(world.member)?.name).toBe("Mo the Elder");
    expect(await peopleByIds([])).toEqual(new Map());
  });
});

describe("settings' read", () => {
  it("lists only this account's sign-in methods", async () => {
    await db.insert(schema.account).values([
      { id: "acc-1", accountId: "a1", providerId: "google", userId: world.admin },
      { id: "acc-2", accountId: "a2", providerId: "credential", userId: world.member },
    ]);

    const linked = await listLinkedAccounts(world.admin);
    expect(linked).toEqual([{ id: "acc-1", providerId: "google" }]);
  });
});

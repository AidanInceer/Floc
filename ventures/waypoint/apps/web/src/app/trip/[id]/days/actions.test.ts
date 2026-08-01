/**
 * Cross-trip itinerary writes (tickets 104, 105).
 *
 * Every test here posts *our* trip id — which the attacker legitimately
 * belongs to — alongside *their* child id. `requireTripAccess` passes; the
 * question is whether the action binds the child back to the trip. Six of them
 * did not.
 *
 * These fail if the trip join is removed from `requireDay` / `requireEvent` /
 * `loadEventSlots`, which is the property that matters — the point is not that
 * the code is correct today but that it cannot quietly stop being.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import {
  expectNotFound,
  migrateTestDb,
  resetDb,
  seedScenario,
  signIn,
  type Scenario,
} from "@/test/db";
import {
  addEvent,
  deleteEvent,
  moveEvent,
  reorderEvents,
  searchPlacesAction,
  swapEvents,
  updateEvent,
} from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  // The outsider is a real, signed-in user with a trip of their own. They are
  // attacking through their own membership, not through a missing session.
  signIn(world.outsider);
});

const titleOf = async (id: number) =>
  (
    await db
      .select({ title: schema.dayEvent.title })
      .from(schema.dayEvent)
      .where(eq(schema.dayEvent.id, id))
      .get()
  )?.title;

const timeOf = async (id: number) =>
  (
    await db
      .select({ time: schema.dayEvent.time })
      .from(schema.dayEvent)
      .where(eq(schema.dayEvent.id, id))
      .get()
  )?.time;

const liveEvents = async (dayId: number) =>
  db
    .select({ id: schema.dayEvent.id })
    .from(schema.dayEvent)
    .where(
      and(
        eq(schema.dayEvent.dayId, dayId),
        isNull(schema.dayEvent.deletedAt),
      ),
    )
    .all();

describe("cross-trip itinerary writes", () => {
  it("addEvent refuses a day belonging to another trip", async () => {
    await expectNotFound(() =>
      addEvent(world.theirs.id, world.ours.dayId, {
        type: "activity",
        title: "Planted",
      }),
    );

    expect(await liveEvents(world.ours.dayId)).toHaveLength(2);
  });

  it("updateEvent refuses an event belonging to another trip", async () => {
    await expectNotFound(() =>
      updateEvent(world.theirs.id, world.ours.eventId, {
        type: "activity",
        title: "Overwritten",
      }),
    );

    expect(await titleOf(world.ours.eventId)).toBe("Ours event");
  });

  it("deleteEvent refuses an event belonging to another trip", async () => {
    await expectNotFound(() =>
      deleteEvent(world.theirs.id, world.ours.eventId),
    );

    expect(await liveEvents(world.ours.dayId)).toHaveLength(2);
  });

  it("reorderEvents cannot reach another trip's day", async () => {
    // No `notFound()` here by design: the day reads as empty, and
    // `permuteEventSlots` refuses a `newOrder` that isn't a permutation of what
    // came back. A silent no-op is the right shape for a drag.
    const flipped = [world.ours.lateEventId, world.ours.eventId];
    await reorderEvents(world.theirs.id, world.ours.dayId, flipped);

    // A drag trades slots, so a successful attack would put 19:00 on the
    // morning event. Times unchanged is the assertion.
    expect(await timeOf(world.ours.eventId)).toBe("09:00");
    expect(await timeOf(world.ours.lateEventId)).toBe("19:00");
  });

  it("swapEvents and moveEvent cannot reach another trip's day", async () => {
    await swapEvents(
      world.theirs.id,
      world.ours.dayId,
      world.ours.eventId,
      world.ours.lateEventId,
    );
    await moveEvent(
      world.theirs.id,
      world.ours.dayId,
      world.ours.eventId,
      "down",
    );

    expect(await timeOf(world.ours.eventId)).toBe("09:00");
    expect(await timeOf(world.ours.lateEventId)).toBe("19:00");
  });

  it("a member can still reorder its own day", async () => {
    // The other half of the property: the join must refuse the outsider
    // without also breaking the drag for the people the trip belongs to.
    signIn(world.member);
    await reorderEvents(world.ours.id, world.ours.dayId, [
      world.ours.lateEventId,
      world.ours.eventId,
    ]);

    expect(await timeOf(world.ours.lateEventId)).toBe("09:00");
    expect(await timeOf(world.ours.eventId)).toBe("19:00");
  });

  it("a member of the trip can still edit its own events", async () => {
    signIn(world.member);
    await updateEvent(world.ours.id, world.ours.eventId, {
      type: "activity",
      title: "Renamed",
    });
    expect(await titleOf(world.ours.eventId)).toBe("Renamed");
  });

  it("a non-member gets the same refusal as for a nonexistent trip", async () => {
    // Rule 5: the two must be indistinguishable, or trip ids are enumerable.
    await expectNotFound(() =>
      updateEvent(world.ours.id, world.ours.eventId, {
        type: "activity",
        title: "Nope",
      }),
    );
    await expectNotFound(() =>
      updateEvent(999_999, world.ours.eventId, {
        type: "activity",
        title: "Nope",
      }),
    );
  });
});

describe("place actions", () => {
  it("searchPlacesAction requires a signed-in user", async () => {
    signIn(null);
    // `requireUser` redirects rather than 404s — there is no trip to protect,
    // only our Nominatim budget.
    await expect(searchPlacesAction("Split")).rejects.toThrow("NEXT_REDIRECT");
  });
});

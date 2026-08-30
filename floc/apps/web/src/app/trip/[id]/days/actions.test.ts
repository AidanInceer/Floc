/**
 * Cross-trip itinerary writes (tickets 104, 105).
 *
 * Each test posts *our* trip id (which the attacker legitimately belongs to)
 * alongside *their* child id — `requireTripAccess` passes, so the question is
 * whether the action binds the child back to the trip. These fail if the trip
 * join is ever removed from `requireDay` / `requireEvent` / `loadEventSlots`.
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
  moveEventToAnotherDay,
  reorderEvents,
  rescheduleEvent,
  setDayOvernight,
  updateEvent,
} from "./actions";
import { searchPlacesAction } from "../place-actions";
import { deriveStops, placedStops } from "@/lib/stops";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  // Attacking through a real membership, not a missing session.
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
    // No `notFound()` by design: the day reads as empty and `permuteEventSlots`
    // refuses a non-permutation — a silent no-op, which is right for a drag.
    const flipped = [world.ours.lateEventId, world.ours.eventId];
    await reorderEvents(world.theirs.id, world.ours.dayId, flipped);

    expect(await timeOf(world.ours.eventId)).toBe("09:00");
    expect(await timeOf(world.ours.lateEventId)).toBe("19:00");
  });

  it("rescheduleEvent cannot reach another trip's event", async () => {
    // Must bind both ends — event and destination day — back to the trip.
    await expectNotFound(() =>
      rescheduleEvent(
        world.theirs.id,
        world.ours.eventId,
        world.ours.dayId,
        "23:00",
        "23:30",
      ),
    );

    expect(await timeOf(world.ours.eventId)).toBe("09:00");
  });

  it("rescheduleEvent cannot drop one of its own events onto another trip's day", async () => {
    signIn(world.member);
    await expectNotFound(() =>
      rescheduleEvent(
        world.ours.id,
        world.ours.eventId,
        world.theirs.dayId,
        "23:00",
        "23:30",
      ),
    );

    expect(await timeOf(world.ours.eventId)).toBe("09:00");
  });

  it("a member can reschedule an event of their own", async () => {
    signIn(world.member);
    await rescheduleEvent(
      world.ours.id,
      world.ours.eventId,
      world.ours.dayId,
      "14:15",
      "15:45",
    );

    expect(await timeOf(world.ours.eventId)).toBe("14:15");
  });

  it("rescheduleEvent refuses a time that isn't a time", async () => {
    // Reachable without the grid (ticket 113), so `HH:MM` is checked here too.
    signIn(world.member);
    await rescheduleEvent(world.ours.id, world.ours.eventId, world.ours.dayId, "9am", null);

    expect(await timeOf(world.ours.eventId)).toBe("09:00");
  });

  it("moveEventToAnotherDay cannot reach another trip's day", async () => {
    await moveEventToAnotherDay(
      world.theirs.id,
      world.ours.eventId,
      world.ours.dayId,
      world.ours.dayId,
    );

    expect(await timeOf(world.ours.eventId)).toBe("09:00");
    expect(await liveEvents(world.ours.dayId)).toHaveLength(2);
  });

  it("a member can still reorder its own day", async () => {
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

/**
 * The overnight band (ticket 141). Tests write days and read *stops* back
 * through `deriveStops` — a column-only assertion would pass even if painting
 * two adjacent days produced two one-night stops.
 */
describe("the overnight band", () => {
  /** Sunday to Wednesday, so a run has room to grow, shrink and be split. */
  const DATES = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"];

  beforeEach(async () => {
    signIn(world.admin);
    // The scenario seeds one day; the rest are blank days on the same trip.
    await db
      .insert(schema.day)
      .values(DATES.slice(1).map((date) => ({ tripId: world.ours.id, date })));
  });

  /** The trip's days as `deriveStops` wants them, in date order. */
  const stopsOfTrip = async () => {
    const rows = await db
      .select({
        dayId: schema.day.id,
        date: schema.day.date,
        overnightPlaceId: schema.day.overnightPlaceId,
        overnightPlaceName: schema.place.name,
      })
      .from(schema.day)
      .leftJoin(schema.place, eq(schema.place.id, schema.day.overnightPlaceId))
      .where(and(eq(schema.day.tripId, world.ours.id), isNull(schema.day.deletedAt)))
      .orderBy(schema.day.date)
      .all();
    return deriveStops(rows);
  };

  const placed = async () => placedStops(await stopsOfTrip());

  it("paints a span in one write", async () => {
    await setDayOvernight(world.ours.id, DATES[0], DATES[2], { name: "Barcelona" });

    expect(await placed()).toMatchObject([
      { placeName: "Barcelona", startDate: DATES[0], endDate: DATES[2] },
    ]);
  });

  it("two adjacent days painted separately are one stop", async () => {
    // Nothing merges these — `deriveStops` groups agreeing consecutive days.
    await setDayOvernight(world.ours.id, DATES[0], DATES[0], { name: "Barcelona" });
    await setDayOvernight(world.ours.id, DATES[1], DATES[1], { name: "Barcelona" });

    const stops = await placed();
    expect(stops).toHaveLength(1);
    expect(stops[0]).toMatchObject({ startDate: DATES[0], endDate: DATES[1], nights: 2 });
  });

  it("clearing a day in the middle splits the stop in two", async () => {
    await setDayOvernight(world.ours.id, DATES[0], DATES[2], { name: "Barcelona" });
    await setDayOvernight(world.ours.id, DATES[1], DATES[1], null);

    expect(await placed()).toMatchObject([
      { placeName: "Barcelona", startDate: DATES[0], endDate: DATES[0] },
      { placeName: "Barcelona", startDate: DATES[2], endDate: DATES[2] },
    ]);
    // The day itself is untouched: an undecided day is a day, not a deletion,
    // so it is still a run of its own between the two halves.
    expect(await stopsOfTrip()).toHaveLength(4);
  });

  it("a span painted across a different place overwrites it", async () => {
    await setDayOvernight(world.ours.id, DATES[3], DATES[3], { name: "Madrid" });
    await setDayOvernight(world.ours.id, DATES[0], DATES[3], { name: "Barcelona" });

    expect(await placed()).toMatchObject([
      { placeName: "Barcelona", startDate: DATES[0], endDate: DATES[3] },
    ]);
  });

  it("extending by place id keeps the row the stay was geocoded into", async () => {
    await setDayOvernight(world.ours.id, DATES[0], DATES[0], {
      name: "Barcelona",
      providerId: "osm:1",
      lat: 41.38,
      lng: 2.17,
    });
    const [first] = await placed();

    await setDayOvernight(world.ours.id, DATES[0], DATES[2], { placeId: first.placeId! });

    const stops = await placed();
    expect(stops).toHaveLength(1);
    // Same row, so the pin survives the extend — a re-geocode by name would
    // have made a second, coordinate-less "Barcelona".
    expect(stops[0].placeId).toBe(first.placeId);
    const rows = await db.select({ id: schema.place.id }).from(schema.place).all();
    expect(rows).toHaveLength(1);
  });

  it("refuses a place id this trip's days don't already use", async () => {
    // The id comes from the client, so an id belonging to another group's
    // itinerary must not be reachable by number (rule 5).
    const other = await db
      .insert(schema.place)
      .values({ name: "Theirs", providerId: "osm:9" })
      .returning({ id: schema.place.id })
      .get();

    await setDayOvernight(world.ours.id, DATES[0], DATES[1], { placeId: other.id });

    expect(await placed()).toHaveLength(0);
  });

  it("sets the days a span covers and creates none", async () => {
    // Since ticket 140 the trip's dates own which days exist, so a span that
    // runs off the end writes what it covers and stops there.
    await setDayOvernight(world.ours.id, DATES[2], "2026-09-30", { name: "Barcelona" });

    expect(await placed()).toMatchObject([
      { startDate: DATES[2], endDate: DATES[3] },
    ]);
    expect(await stopsOfTrip()).toHaveLength(2);
  });

  it("refuses a span that isn't a pair of dates", async () => {
    await setDayOvernight(world.ours.id, "the third", DATES[1], { name: "Barcelona" });
    await setDayOvernight(world.ours.id, DATES[2], DATES[0], { name: "Barcelona" });

    expect(await placed()).toHaveLength(0);
  });

  it("refuses a day belonging to another trip", async () => {
    signIn(world.outsider);
    await expectNotFound(() =>
      setDayOvernight(world.ours.id, DATES[0], DATES[1], { name: "Planted" }),
    );
    expect(await placed()).toHaveLength(0);
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

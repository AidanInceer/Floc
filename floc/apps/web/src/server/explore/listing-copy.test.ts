import { and, asc, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { copyListing } from "@/server/explore/listing-copy";
import { pageText, parsePageBody } from "@floc/core/notes/pages/page-blocks";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const TODAY = "2026-10-22";
const listing = "great-ocean-road-and-uluru";
const copy = (choice: { month: number | null; ideas?: boolean; events?: boolean }, presetId = listing) =>
  copyListing(world.admin, { presetId, ideas: true, events: true, ...choice }, TODAY);

const tripRow = (id: number) => db.select().from(schema.trip).where(eq(schema.trip.id, id)).get();
const pages = (tripId: number) =>
  db.select().from(schema.tripPage).where(eq(schema.tripPage.tripId, tripId)).orderBy(asc(schema.tripPage.position)).all();
const days = (tripId: number) =>
  db
    .select({ id: schema.day.id, date: schema.day.date, place: schema.place.name, countryCode: schema.place.countryCode })
    .from(schema.day)
    .leftJoin(schema.place, eq(schema.place.id, schema.day.overnightPlaceId))
    .where(and(eq(schema.day.tripId, tripId), isNull(schema.day.deletedAt)))
    .orderBy(asc(schema.day.date))
    .all();
const events = (tripId: number) =>
  db
    .select({ date: schema.day.date, type: schema.dayEvent.type, title: schema.dayEvent.title, time: schema.dayEvent.time, mode: schema.dayEvent.transportType })
    .from(schema.dayEvent)
    .innerJoin(schema.day, eq(schema.day.id, schema.dayEvent.dayId))
    .where(eq(schema.day.tripId, tripId))
    .orderBy(asc(schema.day.date), asc(schema.dayEvent.orderIndex))
    .all();

describe("copying a listing with a start month", () => {
  it("dates the trip from the 1st of the next such month and runs it for the listing's nights", async () => {
    const id = (await copy({ month: 10 }))!;
    expect(await tripRow(id)).toMatchObject({ name: "Great Ocean Road to Uluru", startDate: "2027-10-01", endDate: "2027-10-13" });
  });

  it("makes a day per date, each sleeping at its stop in leg order, with a country for the map", async () => {
    const id = (await copy({ month: 10 }))!;
    const rows = await days(id);
    expect(rows).toHaveLength(13);
    expect(rows.map((d) => d.place)).toEqual([
      "Melbourne", "Melbourne", "Melbourne", "Lorne", "Port Campbell", "Grampians", "Grampians", "Adelaide", "Adelaide", "Uluru", "Uluru", "Uluru", "Uluru",
    ]);
    expect(rows.every((d) => d.countryCode === "AU")).toBe(true);
  });

  it("copies each move as a transport event with its mode, and the timed lines as events", async () => {
    const id = (await copy({ month: 10 }))!;
    const all = await events(id);
    expect(all.filter((e) => e.type === "transport").map((e) => [e.date, e.title, e.mode])).toEqual([
      ["2027-10-04", "Melbourne to Lorne", "car"],
      ["2027-10-05", "Lorne to Port Campbell", "car"],
      ["2027-10-06", "Port Campbell to Grampians", "car"],
      ["2027-10-08", "Grampians to Adelaide", "car"],
      ["2027-10-10", "Adelaide to Uluru", "flight"],
    ]);
    expect(all).toContainEqual({ date: "2027-10-01", type: "food", title: "Dinner in Chinatown", time: "19:30", mode: null });
    expect(all.some((e) => e.title?.startsWith("Free day"))).toBe(false);
  });

  it("keeps the moves but no other events when events are off", async () => {
    const id = (await copy({ month: 10, events: false }))!;
    expect(new Set((await events(id)).map((e) => e.type))).toEqual(new Set(["transport"]));
  });

  it("adds an Ideas page after the highlights page", async () => {
    const id = (await copy({ month: 10 }))!;
    const [notes, ideas] = await pages(id);
    expect(pageText(parsePageBody(notes.body))).toContain("Uluru at first light");
    expect(ideas.title).toBe("Ideas");
    expect(pageText(parsePageBody(ideas.body))).toContain("Kangaroo Island");
  });

  it("adds no Ideas page when ideas are off", async () => {
    const id = (await copy({ month: 10, ideas: false }))!;
    expect((await pages(id)).map((p) => p.title)).toEqual(["Notes"]);
  });
});

describe("copying a listing to decide later", () => {
  it("makes an undated trip with the highlights page only", async () => {
    const id = (await copy({ month: null }))!;
    expect(await tripRow(id)).toMatchObject({ startDate: null, endDate: null });
    expect(await days(id)).toEqual([]);
    expect((await pages(id)).map((p) => p.title)).toEqual(["Notes"]);
  });

  it("treats a month the listing does not name as decide later", async () => {
    const id = (await copy({ month: 7 }))!;
    expect((await tripRow(id))?.startDate).toBeNull();
  });
});

it("answers null for a listing that is not there", async () => {
  expect(await copy({ month: 10 }, "no-such-listing")).toBeNull();
});

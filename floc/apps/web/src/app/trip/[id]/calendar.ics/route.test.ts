import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { GET } from "./route";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const download = (tripId: number) =>
  GET(new Request(`http://localhost/trip/${tripId}/calendar.ics`), { params: Promise.resolve({ id: String(tripId) }) });

describe("downloading a trip's calendar", () => {
  it("hands a member the file, whatever their feed link's number", async () => {
    signIn(world.member);
    const response = await download(world.ours.id);
    expect(response.headers.get("Content-Disposition")).toBe(`attachment; filename="trip-${world.ours.id}.ics"`);
    expect(await response.text()).toContain("X-WR-CALNAME:Ours");
  });

  it("answers someone not on the trip as a trip that does not exist (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => download(world.ours.id));
  });
});

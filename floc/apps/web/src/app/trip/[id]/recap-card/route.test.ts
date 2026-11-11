import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { GET } from "./route";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const picture = (tripId: number, query = "") =>
  GET(new Request(`http://localhost/trip/${tripId}/recap-card${query}`), { params: Promise.resolve({ id: String(tripId) }) });

const dated = (startDate: string | null, endDate: string | null) =>
  db.update(schema.trip).set({ startDate, endDate }).where(eq(schema.trip.id, world.ours.id)).run();

describe("the recap share picture (#443, ADR-045)", () => {
  it("is a private PNG for a member once the trip has ended", async () => {
    await dated("2020-05-01", "2020-05-04");
    signIn(world.member);
    const response = await picture(world.ours.id);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("draws in dark when asked, and in light otherwise", async () => {
    await dated("2020-05-01", "2020-05-04");
    signIn(world.member);
    const [light, dark] = await Promise.all([picture(world.ours.id), picture(world.ours.id, "?theme=dark")]);
    const [a, b] = await Promise.all([light.arrayBuffer(), dark.arrayBuffer()]);
    expect(dark.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it("does not exist while the trip is still ahead", async () => {
    await dated("2999-05-01", "2999-05-04");
    signIn(world.member);
    await expectNotFound(() => picture(world.ours.id));
  });

  it("does not exist for an undated trip (rule 9)", async () => {
    await dated(null, null);
    signIn(world.member);
    await expectNotFound(() => picture(world.ours.id));
  });

  it("answers someone not on the trip as a trip that does not exist (rule 5)", async () => {
    await dated("2020-05-01", "2020-05-04");
    signIn(world.outsider);
    await expectNotFound(() => picture(world.ours.id));
  });
});

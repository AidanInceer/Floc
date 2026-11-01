import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { generateMetadata } from "./layout";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.admin);
});

describe("the trip's page title", () => {
  it("names the trip once, since the root template adds Floc", async () => {
    await db.update(schema.trip).set({ name: "krakow, last winter" }).where(eq(schema.trip.id, world.ours.id));
    const meta = await generateMetadata({ params: Promise.resolve({ id: String(world.ours.id) }) });
    expect(meta.title).toEqual({ default: "Krakow, Last Winter", template: "%s · Krakow, Last Winter · Floc" });
  });
});

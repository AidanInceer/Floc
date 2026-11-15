import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { acceptedTerms, recordTermsAcceptance } from "./terms-acceptance";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the record of which terms an account agreed to", () => {
  it("holds the version and the time", async () => {
    const at = new Date("2026-11-15T09:30:00Z");
    await recordTermsAcceptance(world.member, TERMS_VERSION, at);
    expect(await acceptedTerms(world.member)).toEqual([{ version: TERMS_VERSION, acceptedAt: at }]);
  });

  it("keeps the first time for a version, however often it is recorded", async () => {
    const first = new Date("2026-11-15T09:30:00Z");
    await recordTermsAcceptance(world.member, "2026-11-15", first);
    await recordTermsAcceptance(world.member, "2026-11-15", new Date("2026-12-01T00:00:00Z"));
    expect(await acceptedTerms(world.member)).toEqual([{ version: "2026-11-15", acceptedAt: first }]);
  });

  it("keeps each version an account agreed to, newest first, and nobody else's", async () => {
    await recordTermsAcceptance(world.member, "2026-11-15", new Date("2026-11-15T09:30:00Z"));
    await recordTermsAcceptance(world.member, "2027-02-01", new Date("2027-02-03T10:00:00Z"));
    await recordTermsAcceptance(world.admin, "2026-11-15", new Date("2026-11-16T00:00:00Z"));
    expect((await acceptedTerms(world.member)).map((row) => row.version)).toEqual(["2027-02-01", "2026-11-15"]);
  });
});

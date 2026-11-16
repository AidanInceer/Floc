import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile } from "@/server/auth/profile";
import { setMarketingEmailConsent } from "@/server/consent/marketing-consent";

let world: Scenario;

const consentAt = async () =>
  (await db.select({ at: schema.userProfile.marketingEmailConsentAt }).from(schema.userProfile).where(eq(schema.userProfile.userId, world.member)))[0]?.at ?? null;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await ensureProfile(world.member);
});

describe("consent to advertising email", () => {
  it("is off for a new profile", async () => {
    expect(await consentAt()).toBeNull();
  });

  it("records when the person agreed", async () => {
    const at = new Date("2026-11-15T10:00:00Z");
    await setMarketingEmailConsent(world.member, true, at);
    expect(await consentAt()).toEqual(at);
  });

  it("keeps the first agreement when the switch is saved on again", async () => {
    const first = new Date("2026-11-15T10:00:00Z");
    await setMarketingEmailConsent(world.member, true, first);
    await setMarketingEmailConsent(world.member, true, new Date("2026-12-01T10:00:00Z"));
    expect(await consentAt()).toEqual(first);
  });

  it("is cleared when the person withdraws it", async () => {
    await setMarketingEmailConsent(world.member, true, new Date("2026-11-15T10:00:00Z"));
    await setMarketingEmailConsent(world.member, false, new Date("2026-11-16T10:00:00Z"));
    expect(await consentAt()).toBeNull();
  });
});

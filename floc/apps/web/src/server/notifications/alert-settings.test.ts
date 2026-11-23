import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { readAlertSettings, saveAlertSettings, setMarketingEmailConsent } from "@/server/notifications/alert-settings";

let world: Scenario;

const consentAt = async () => (await readAlertSettings(world.member)).marketingEmailConsentAt;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("a person's alert settings", () => {
  it("are all on, with no advertising consent, for a person who never saved any", async () => {
    expect(await readAlertSettings(world.member)).toEqual({
      notifyPush: true,
      notifyEmail: true,
      notifyReminders: true,
      notifyNextTrip: true,
      marketingEmailConsentAt: null,
    });
  });

  it("keep one switch turned off and leave the others on", async () => {
    await saveAlertSettings(world.member, { notifyEmail: false });
    expect(await readAlertSettings(world.member)).toMatchObject({ notifyPush: true, notifyEmail: false, notifyReminders: true });
  });

  it("keep advertising consent when the alert switches are saved", async () => {
    const at = new Date("2026-11-15T10:00:00Z");
    await setMarketingEmailConsent(world.member, true, at);
    await saveAlertSettings(world.member, { notifyPush: false });
    expect(await consentAt()).toEqual(at);
  });
});

describe("consent to advertising email", () => {
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

  it("stays off for a person who withdraws before ever agreeing", async () => {
    await setMarketingEmailConsent(world.member, false, new Date("2026-11-16T10:00:00Z"));
    expect(await consentAt()).toBeNull();
  });
});

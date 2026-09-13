/**
 * The account half of the port — settings, the travel map and saved lists.
 *
 * The point is not that the queries work; `profile.test.ts` and the rest cover
 * those. It is that the rules the web pages keep by hand survive the new door
 * the phone comes through: a seed-only tag list that a hand-made call must not
 * be able to widen, the refusal to unlink a last sign-in method, and a kit
 * that only ever resolves for its owner.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("settings", () => {
  it("reads back defaults for somebody who has never opened settings", async () => {
    const settings = await webPort.loadMySettings(world.member);

    expect(settings.email).toBe("u-member@example.test");
    expect(settings.isPrivate).toBe(false);
    expect(settings.packTier).toBe("balanced");
    expect(settings.homeCurrency).toBe("GBP");
    expect(settings.vibeTags).toEqual([]);
  });

  it("keeps every privacy field it was given", async () => {
    await webPort.updatePrivacy(world.member, {
      isPrivate: true,
      visibilityVibeTags: "friends",
      visibilityTravelMap: "trip_members",
      visibilityFriends: "private",
      pastTripsShow: "latest",
    });

    const settings = await webPort.loadMySettings(world.member);
    expect(settings.isPrivate).toBe(true);
    expect(settings.visibilityVibeTags).toBe("friends");
    expect(settings.pastTripsShow).toBe("latest");
  });

  it("drops a vibe tag that isn't in the seed list", async () => {
    await webPort.updateVibeTags(world.member, ["hiking", "smuggling"]);

    const settings = await webPort.loadMySettings(world.member);
    expect(settings.vibeTags).toEqual(["hiking"]);
  });

  it("moves the diets, the note and the sharing switch together", async () => {
    await webPort.updateDietary(world.member, {
      flags: ["vegan"],
      notes: "severe nut allergy",
      share: true,
    });

    const settings = await webPort.loadMySettings(world.member);
    expect(settings.dietFlags).toEqual(["vegan"]);
    expect(settings.dietaryNotes).toBe("severe nut allergy");
    expect(settings.shareDietary).toBe(true);
  });

  it("keeps the three notification switches, all on until changed (#346)", async () => {
    const before = await webPort.loadMySettings(world.member);
    expect([before.notifyPush, before.notifyEmail, before.notifyReminders]).toEqual([true, true, true]);

    await webPort.updateNotifications(world.member, { push: false, email: true, reminders: false });

    const after = await webPort.loadMySettings(world.member);
    expect([after.notifyPush, after.notifyEmail, after.notifyReminders]).toEqual([false, true, false]);
  });

  it("refuses to unlink the last sign-in method", async () => {
    await db.insert(schema.account).values({
      id: "acc-only",
      accountId: "u-member",
      providerId: "google",
      userId: world.member,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(await webPort.unlinkSignIn(world.member, "acc-only")).toBe(false);
  });

  it("unlinks one when a second remains", async () => {
    await db.insert(schema.account).values([
      {
        id: "acc-google",
        accountId: "u-member",
        providerId: "google",
        userId: world.member,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "acc-password",
        accountId: "u-member",
        providerId: "credential",
        userId: world.member,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    expect(await webPort.unlinkSignIn(world.member, "acc-google")).toBe(true);
    const settings = await webPort.loadMySettings(world.member);
    expect(settings.signInMethods.map((m) => m.provider)).toEqual(["credential"]);
  });
});

describe("the travel map", () => {
  it("paints a country and takes the paint off again", async () => {
    await webPort.setCountryMark(world.member, "PT", "green");
    expect((await webPort.loadMyProfile(world.member)).map).toContainEqual({
      code: "PT",
      state: "green",
    });

    await webPort.setCountryMark(world.member, "PT", "blank");
    expect((await webPort.loadMyProfile(world.member)).map).toEqual([]);
  });

  it("ignores a code that is not a country", async () => {
    await webPort.setCountryMark(world.member, "ZZ", "green");
    expect((await webPort.loadMyProfile(world.member)).map).toEqual([]);
  });

  it("will not answer a question nobody parked", async () => {
    // No `map_prompt_at` on this membership, so keeping must write nothing.
    await webPort.answerMapPrompt(world.member, world.ours.id, true);
    expect((await webPort.loadMyProfile(world.member)).map).toEqual([]);
  });
});

describe("saved packing lists", () => {
  it("makes a list, fills it, counts it and empties it", async () => {
    const made = await webPort.createKit(world.member, "Photography");
    expect(made).not.toBeNull();

    await webPort.addKitItem(world.member, made!.id, {
      label: "Spare battery",
      category: "other",
      quantity: 2,
    });

    const [kit] = await webPort.listMyKits(world.member);
    expect(kit.name).toBe("Photography");
    expect(kit.items).toHaveLength(1);
    expect(kit.items[0].quantity).toBe(2);

    await webPort.stepKitItemQuantity(world.member, kit.items[0].id, -1);
    const [stepped] = await webPort.listMyKits(world.member);
    expect(stepped.items[0].quantity).toBe(1);

    await webPort.removeKitItem(world.member, kit.items[0].id);
    expect((await webPort.listMyKits(world.member))[0].items).toEqual([]);
  });

  it("never shows or touches somebody else's list", async () => {
    const made = await webPort.createKit(world.member, "Gym");
    expect(await webPort.listMyKits(world.outsider)).toEqual([]);

    await webPort.renameKit(world.outsider, made!.id, "Stolen");
    await webPort.deleteKit(world.outsider, made!.id);

    const [kit] = await webPort.listMyKits(world.member);
    expect(kit.name).toBe("Gym");
  });
});

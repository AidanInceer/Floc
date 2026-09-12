import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { hasPendingMapPrompt, removeMembership } from "@/server/trips/roster";
import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import {
  dropPromptCountries,
  keepPromptCountries,
  setAvatarIcon,
  setCountryMark,
  updateCurrency,
  updateDietary,
  updateIdentity,
  updatePacking,
  updateVibeTags,
} from "./actions";

let world: Scenario;

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(key, v);
  }
  return fd;
}

const profile = () =>
  db.select().from(schema.userProfile).where(eq(schema.userProfile.userId, world.member)).get();
const marks = () =>
  db.select().from(schema.userCountryMark).where(eq(schema.userCountryMark.userId, world.member)).all();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

describe("the profile", () => {
  it("saves the name, making the profile if it is missing", async () => {
    expect(await updateIdentity(form({ displayName: "Mo B" }))).toEqual({});
    expect(await profile()).toMatchObject({ displayName: "Mo B" });
  });

  it("sets a face from the list", async () => {
    await setAvatarIcon(form({ avatarIcon: "compass" }));
    expect((await profile())?.avatarIcon).toBe("compass");
  });

  it("clears back to initials", async () => {
    await setAvatarIcon(form({ avatarIcon: "compass" }));
    await setAvatarIcon(form({ avatarIcon: "" }));
    expect((await profile())?.avatarIcon).toBeNull();
  });

  it("takes initials over an icon nobody drew, rather than throwing", async () => {
    await setAvatarIcon(form({ avatarIcon: "tent" }));
    expect((await profile())?.avatarIcon).toBeNull();
  });

  it("saves a supported currency and refuses any other", async () => {
    expect(await updateCurrency(form({ homeCurrency: "EUR" }))).toEqual({});
    expect(await updateCurrency(form({ homeCurrency: "XXX" }))).toEqual({ error: "Pick a currency Floc supports." });
    expect((await profile())?.homeCurrency).toBe("EUR");
  });

  it("keeps only vibe tags from the list, and clears to nothing", async () => {
    await updateVibeTags(form({ vibeTag: ["beaches", "made up"] }));
    expect((await profile())?.vibeTags).toEqual(["beaches"]);

    await updateVibeTags(form({}));
    expect((await profile())?.vibeTags).toBeNull();
  });

  it("saves the dietary record as one", async () => {
    await updateDietary(form({ dietFlag: ["vegan", "nonsense"], dietaryNotes: "  nut allergy  ", shareDietary: "on" }));
    expect(await profile()).toMatchObject({ dietFlags: ["vegan"], dietaryNotes: "nut allergy", shareDietary: true });

    await updateDietary(form({}));
    expect(await profile()).toMatchObject({ dietFlags: null, dietaryNotes: null, shareDietary: false });
  });

  it("saves packing defaults and refuses an unknown style", async () => {
    expect(await updatePacking(form({ packTier: "light", packAutoGenerate: "on" }))).toEqual({});
    expect(await updatePacking(form({ packTier: "featherweight" }))).toEqual({ error: "Pick a packing style." });
    expect(await profile()).toMatchObject({ packTier: "light", packAutoGenerate: true });
  });

  it("sends a signed-out visitor to log in", async () => {
    signIn(null);
    await expect(updateIdentity(form({ displayName: "x" }))).rejects.toThrow(`${REDIRECT}:/login`);
  });
});

describe("the travel map", () => {
  it("marks a country by hand, and blanks it again", async () => {
    await setCountryMark("fr", "green");
    expect(await marks()).toMatchObject([{ countryCode: "FR", state: "green" }]);

    await setCountryMark("FR", "yellow");
    expect(await marks()).toMatchObject([{ state: "yellow" }]);

    await setCountryMark("FR", "blank");
    expect(await marks()).toEqual([]);
  });

  it("ignores a code that is not a country", async () => {
    await setCountryMark("ZZ", "green");
    expect(await marks()).toEqual([]);
  });

  it("answers the question a left trip leaves behind, either way", async () => {
    await removeMembership(world.ours.id, world.member);
    expect(await hasPendingMapPrompt(world.ours.id, world.member)).toBe(true);
    await dropPromptCountries(form({ tripId: String(world.ours.id) }));
    expect(await hasPendingMapPrompt(world.ours.id, world.member)).toBe(false);

    await db
      .update(schema.tripMembership)
      .set({ mapPromptAt: new Date() })
      .where(eq(schema.tripMembership.userId, world.member));
    await keepPromptCountries(form({ tripId: String(world.ours.id) }));
    expect(await hasPendingMapPrompt(world.ours.id, world.member)).toBe(false);
  });

  it("does nothing when there is no question to answer", async () => {
    await keepPromptCountries(form({ tripId: String(world.ours.id) }));
    expect(await marks()).toEqual([]);
  });
});

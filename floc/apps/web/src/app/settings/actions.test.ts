import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { listConnectedApps } from "@/server/auth/connected-apps";
import { readPrivacy } from "@/server/auth/privacy";
import { readTravelStyle } from "@/server/auth/travel-style";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { disconnectConnectedApp, updatePrivacy } from "./actions";

let world: Scenario;

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return fd;
}

const rings = {
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "friends",
  visibilityFriends: "private",
  visibilitySaved: "friends",
};

const profile = async () => ({
  ...(await readPrivacy(world.member)),
  styleInGroupIdeas: (await readTravelStyle(world.member)).styleInGroupIdeas,
});

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

describe("connected apps (#354)", () => {
  const clientId = "https://agent.example/client.json";

  beforeEach(async () => {
    await db.insert(schema.oauthClient).values({ id: "c1", clientId, name: "Trip agent", redirectUris: "[]" });
    await db.insert(schema.oauthConsent).values([
      { id: "o1", clientId, userId: world.member, scopes: "[]" },
      { id: "o2", clientId, userId: world.admin, scopes: "[]" },
    ]);
  });

  it("disconnects an app for the signed-in person only", async () => {
    await disconnectConnectedApp(form({ clientId }));
    expect(await listConnectedApps(world.member)).toEqual([]);
    expect(await listConnectedApps(world.admin)).toHaveLength(1);
  });

  it("says so when the app could not be disconnected", async () => {
    const failing = vi.spyOn(db, "transaction").mockRejectedValueOnce(new Error("database is busy"));
    expect(await disconnectConnectedApp(form({ clientId }))).toEqual({ error: "Could not disconnect. Try again." });
    failing.mockRestore();
    expect(await listConnectedApps(world.member)).toHaveLength(1);
  });
});

describe("privacy", () => {
  it("saves each ring and the private switch", async () => {
    expect(await updatePrivacy(form({ ...rings, isPrivate: "on" }))).toEqual({});
    expect(await profile()).toMatchObject({
      isPrivate: true,
      visibilityVibeTags: "trip_members",
      visibilityTravelMap: "friends",
      visibilityFriends: "private",
      visibilitySaved: "friends",
    });
  });

  it("reads the latest-trip switch as latest, and its absence as all", async () => {
    await updatePrivacy(form({ ...rings, pastTripsLatest: "on" }));
    expect((await profile())?.pastTripsShow).toBe("latest");

    await updatePrivacy(form(rings));
    expect((await profile())?.pastTripsShow).toBe("all");
  });

  it("reads the trip-ideas switch as on, and its absence as off (#177, ADR-074)", async () => {
    expect((await profile())?.styleInGroupIdeas ?? true).toBe(true);

    await updatePrivacy(form(rings));
    expect((await profile())?.styleInGroupIdeas).toBe(false);

    await updatePrivacy(form({ ...rings, styleInGroupIdeas: "on" }));
    expect((await profile())?.styleInGroupIdeas).toBe(true);
  });

  it("refuses a ring that isn't one", async () => {
    expect(await updatePrivacy(form({ ...rings, visibilityFriends: "everyone" }))).toEqual({
      error: "That isn't one of the visibility options.",
    });
  });
});

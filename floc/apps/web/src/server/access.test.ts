/**
 * #403: the guest door. A signed-in person on the sign-in pages could walk
 * back through history and become somebody else without signing out, so
 * `requireGuest` turns them round.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { requireGuest } from "@/server/access";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("requireGuest", () => {
  it("lets a signed-out visitor through", async () => {
    signIn(null);
    await expect(requireGuest()).resolves.toBeUndefined();
  });

  it("turns a signed-in person round to their trips", async () => {
    signIn(world.member);
    await expect(requireGuest()).rejects.toThrow(`${REDIRECT}:/trips`);
  });

  it("sends them where they were headed instead, when that is given", async () => {
    signIn(world.member);
    await expect(requireGuest("/inbox")).rejects.toThrow(`${REDIRECT}:/inbox`);
  });

  it("ignores an off-site target, so the redirect cannot be aimed elsewhere", async () => {
    signIn(world.member);
    await expect(requireGuest("https://evil.example/steal")).rejects.toThrow(`${REDIRECT}:/trips`);
  });
});

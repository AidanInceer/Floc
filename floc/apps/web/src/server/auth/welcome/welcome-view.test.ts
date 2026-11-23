import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getProfile } from "@/server/auth/profile";
import { markTourSeen } from "@/server/auth/tour";
import { startPeople, welcomeView } from "@/server/auth/welcome/welcome-view";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

const request = vi.hoisted(() => ({ headers: new Headers() }));

vi.mock("next/headers", () => ({
  headers: async () => request.headers,
  cookies: async () => new Map(),
}));

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  request.headers = new Headers();
});

describe("the welcome a new person sees (#707)", () => {
  it("is not shown once the welcome is done", async () => {
    await markTourSeen(world.member);
    expect(await welcomeView({ id: world.member, name: "Mo" }, [])).toBeNull();
  });

  it("uses a welcome state the page already read", async () => {
    const read = { due: false, currency: "GBP" as const, answers: { vibeTags: [] } };
    expect(await welcomeView({ id: world.member, name: "Mo" }, [], null, read)).toBeNull();
  });

  it("guesses the currency from the country and offers its airports", async () => {
    request.headers = new Headers({ "cf-ipcountry": "IE" });
    const view = await welcomeView({ id: world.member, name: "Mo" }, [{ id: world.admin, name: "Ada" }], "Ours");
    expect(view).toMatchObject({ me: "Mo", currency: "EUR", invited: "Ours", people: [{ id: world.admin, name: "Ada" }] });
    expect(view?.picks.map((pick) => pick.code)).toContain("DUB");
    expect((await getProfile(world.member))?.homeCurrency).toBe("EUR");
  });

  it("offers no airports when the country is not known", async () => {
    const view = await welcomeView({ id: world.member, name: "Mo" }, []);
    expect(view).toMatchObject({ invited: null, picks: [], answers: { airport: null } });
  });
});

describe("the people a new trip can start with", () => {
  it("lists each friend or group member once", () => {
    const ada = { id: "a", name: "Ada" };
    const mo = { id: "m", name: "Mo" };
    expect(startPeople([[ada, mo], [{ ...ada, name: "Ada L" }]])).toEqual([ada, mo]);
  });
});

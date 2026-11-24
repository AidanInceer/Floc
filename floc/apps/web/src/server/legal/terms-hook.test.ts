import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("better-auth", () => ({ betterAuth: (options: unknown) => ({ options }) }));
vi.mock("better-auth/adapters/drizzle", () => ({ drizzleAdapter: () => ({}) }));
vi.mock("better-auth/next-js", () => ({ nextCookies: () => ({}) }));
vi.mock("better-auth/plugins", () => ({ anonymous: () => ({}), bearer: () => ({}), jwt: () => ({}) }));
vi.mock("@better-auth/expo", () => ({ expo: () => ({}) }));
vi.mock("@better-auth/mcp", () => ({ mcp: () => ({}) }));
vi.mock("@better-auth/cimd", () => ({ cimd: () => ({}) }));
vi.mock("@better-auth/cimd/node", () => ({ fetchClientMetadataResource: () => ({}) }));

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { acceptedTerms } from "@/server/legal/terms-acceptance";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

const created = async (user: { id: string; isAnonymous?: boolean }) => {
  const { auth } = await vi.importActual<typeof import("@/server/auth/auth")>("@/server/auth/auth");
  await auth.options.databaseHooks?.user?.create?.after?.(user as never);
};

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("a new account", () => {
  it("is recorded as agreeing to the terms in force, however it signed up (#549)", async () => {
    await created({ id: world.member });
    expect((await acceptedTerms(world.member)).map((row) => row.version)).toEqual([TERMS_VERSION]);
  });

  it("is not recorded for a guest on an invite link, who agreed to nothing", async () => {
    await created({ id: world.member, isAnonymous: true });
    expect(await acceptedTerms(world.member)).toEqual([]);
  });
});

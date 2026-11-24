import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { agentViewer, disconnectApp, listConnectedApps, readConnectRequest } from "@/server/auth/connected-apps";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

const CLIENT = "https://agent.example/client.json";
const OTHER_CLIENT = "https://other.example/client.json";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.oauthClient).values([
    { id: "c1", clientId: CLIENT, name: "Trip agent", redirectUris: "[]" },
    { id: "c2", clientId: OTHER_CLIENT, name: "Other agent", redirectUris: "[]" },
  ]);
});

async function connect(userId: string, clientId: string, id: string) {
  await db.insert(schema.oauthConsent).values({ id, clientId, userId, scopes: '["floc:read"]', createdAt: new Date("2026-11-01") });
  await db.insert(schema.oauthRefreshToken).values({ id: `r-${id}`, token: `t-${id}`, clientId, userId, scopes: '["floc:read"]' });
}

describe("who an agent acts for (#354)", () => {
  it("is the person who said yes to that app", async () => {
    await connect(world.member, CLIENT, "a");
    expect((await agentViewer({ sub: world.member, azp: CLIENT }))?.id).toBe(world.member);
  });

  it("is nobody for an app the person never allowed", async () => {
    await connect(world.member, CLIENT, "a");
    expect(await agentViewer({ sub: world.member, azp: OTHER_CLIENT })).toBeNull();
    expect(await agentViewer({ sub: world.admin, azp: CLIENT })).toBeNull();
  });

  it("is nobody for a token with no person or no app", async () => {
    await connect(world.member, CLIENT, "a");
    expect(await agentViewer({ azp: CLIENT })).toBeNull();
    expect(await agentViewer({ sub: world.member })).toBeNull();
  });

  it("is nobody once the app is disabled", async () => {
    await connect(world.member, CLIENT, "a");
    await db.update(schema.oauthClient).set({ disabled: true }).where(eq(schema.oauthClient.clientId, CLIENT));
    expect(await agentViewer({ sub: world.member, azp: CLIENT })).toBeNull();
  });

  it("is never a guest", async () => {
    await connect(world.member, CLIENT, "a");
    await db.update(schema.user).set({ isAnonymous: true }).where(eq(schema.user.id, world.member));
    expect(await agentViewer({ sub: world.member, azp: CLIENT })).toBeNull();
  });
});

describe("a request to connect (#354)", () => {
  const asking = (clientId: string, secondsLeft = 60) =>
    new URLSearchParams({ client_id: clientId, exp: String(Math.floor(Date.now() / 1000) + secondsLeft) });

  it("names the app and the host that vouches for it", async () => {
    expect(await readConnectRequest(asking(CLIENT))).toMatchObject({ name: "Trip agent", host: "agent.example" });
  });

  it("names where the person is really sent back", async () => {
    const query = asking(CLIENT);
    query.set("redirect_uri", "https://elsewhere.example/cb");
    expect((await readConnectRequest(query))?.returnsTo).toBe("elsewhere.example");
  });

  it("names the scheme of a desktop app with no host", async () => {
    const query = asking(CLIENT);
    query.set("redirect_uri", "com.agent.app:/callback");
    expect((await readConnectRequest(query))?.returnsTo).toBe("com.agent.app");
  });

  it("never takes its host from an address the app typed about itself", async () => {
    await db.insert(schema.oauthClient).values({ id: "c3", clientId: "plain-id", name: "Claude", uri: "https://claude.ai", redirectUris: "[]" });
    expect((await readConnectRequest(asking("plain-id")))?.host).toBeNull();
  });

  it("has ended once its time is up", async () => {
    expect(await readConnectRequest(asking(CLIENT, -60))).toBeNull();
  });

  it("is refused for an unknown or disabled app", async () => {
    expect(await readConnectRequest(asking("https://unknown.example/client.json"))).toBeNull();
    await db.update(schema.oauthClient).set({ disabled: true }).where(eq(schema.oauthClient.clientId, CLIENT));
    expect(await readConnectRequest(asking(CLIENT))).toBeNull();
  });

  it("cuts a very long app name", async () => {
    await db.update(schema.oauthClient).set({ name: "A".repeat(300) }).where(eq(schema.oauthClient.clientId, CLIENT));
    expect((await readConnectRequest(asking(CLIENT)))?.name).toHaveLength(60);
  });
});

describe("connected apps (#354)", () => {
  it("lists only this person's apps, with the host that vouches for each", async () => {
    await connect(world.member, CLIENT, "a");
    await connect(world.admin, OTHER_CLIENT, "b");
    expect(await listConnectedApps(world.member)).toEqual([
      { clientId: CLIENT, name: "Trip agent", host: "agent.example" },
    ]);
  });

  it("cuts an app off at once, and ends its refresh tokens", async () => {
    await connect(world.member, CLIENT, "a");
    await disconnectApp(world.member, CLIENT);
    expect(await agentViewer({ sub: world.member, azp: CLIENT })).toBeNull();
    expect(await listConnectedApps(world.member)).toEqual([]);
    expect(await db.select().from(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, world.member))).toEqual([]);
  });

  it("leaves another person's connection to the same app alone", async () => {
    await connect(world.member, CLIENT, "a");
    await connect(world.admin, CLIENT, "b");
    await disconnectApp(world.member, CLIENT);
    expect((await agentViewer({ sub: world.admin, azp: CLIENT }))?.id).toBe(world.admin);
    expect(await db.select().from(schema.oauthRefreshToken).where(eq(schema.oauthRefreshToken.userId, world.admin))).toHaveLength(1);
  });
});

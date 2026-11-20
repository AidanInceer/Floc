import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import WebSocket from "ws";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { tripDocumentName } from "@floc/core/notes/live/live-names";
import { readTripChange } from "@floc/core/notes/live/trip-signal";
import { removeMembership } from "@/server/trips/roster";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { attachNotesLive, LIVE_NOTES_PATH } from "./live-socket";
import { tripChanged } from "./live-trip";
import { createNotesLive } from "./notes-live";

let world: Scenario;
let server: Server;
let url: string;
const open: HocuspocusProvider[] = [];
const sockets: HocuspocusProviderWebsocket[] = [];

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  const live = createNotesLive({ resolveUser: async (headers) => headers.get("cookie"), debounce: 0, recheckMs: 0 });
  server = createServer((_req, res) => res.end());
  attachNotesLive(server, live);
  await new Promise<void>((done) => server.listen(0, done));
  url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}${LIVE_NOTES_PATH}`;
});
afterEach(async () => {
  open.splice(0).forEach((p) => p.destroy());
  sockets.splice(0).forEach((s) => s.destroy());
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
});

function listenAs(userId: string, tripId: number) {
  const WebSocketPolyfill = class extends WebSocket {
    constructor(address: string) {
      super(address, { headers: { cookie: userId } });
    }
  };
  const websocketProvider = new HocuspocusProviderWebsocket({ url, WebSocketPolyfill });
  const provider = new HocuspocusProvider({ websocketProvider, name: tripDocumentName(tripId), token: "session" });
  provider.attach();
  open.push(provider);
  sockets.push(websocketProvider);
  const heard: string[][] = [];
  const sent: number[] = [];
  provider.on("stateless", ({ payload }: { payload: string }) => {
    const change = readTripChange(payload);
    if (change) {
      heard.push(change.areas);
      sent.push(change.sentAt);
    }
  });
  return { provider, heard, sent };
}

const until = (check: () => boolean) =>
  new Promise<void>((done, fail) => {
    const started = Date.now();
    const tick = () =>
      check() ? done() : Date.now() - started > 4_000 ? fail(new Error("timed out")) : setTimeout(tick, 20);
    tick();
  });

describe("the trip channel", () => {
  it("tells every member which areas of the trip changed", async () => {
    const ada = listenAs(world.admin, world.ours.id);
    const mo = listenAs(world.member, world.ours.id);
    await until(() => ada.provider.isSynced && mo.provider.isSynced);

    tripChanged(world.ours.id, ["money"]);

    await until(() => ada.heard.length === 1 && mo.heard.length === 1);
    expect(mo.heard[0]).toEqual(["money"]);
  });

  it("says when the server sent the change, so a page drawn after it can skip the refresh", async () => {
    const mo = listenAs(world.member, world.ours.id);
    await until(() => mo.provider.isSynced);

    const before = Date.now();
    tripChanged(world.ours.id, ["days"]);

    await until(() => mo.sent.length === 1);
    expect(mo.sent[0]).toBeGreaterThanOrEqual(before);
    expect(mo.sent[0]).toBeLessThanOrEqual(Date.now());
  });

  it("says nothing to a member of another trip", async () => {
    const mo = listenAs(world.member, world.ours.id);
    const ozz = listenAs(world.outsider, world.theirs.id);
    await until(() => mo.provider.isSynced && ozz.provider.isSynced);

    tripChanged(world.ours.id, ["packing"]);

    await until(() => mo.heard.length === 1);
    expect(ozz.heard).toEqual([]);
  });

  it("refuses a non-member (rule 5)", async () => {
    let refused = "";
    const ozz = listenAs(world.outsider, world.ours.id);
    ozz.provider.on("authenticationFailed", ({ reason }: { reason: string }) => (refused = reason));
    await until(() => refused !== "");
    expect(ozz.provider.isSynced).toBe(false);
  });

  it("stops telling a removed member at once", async () => {
    const mo = listenAs(world.member, world.ours.id);
    await until(() => mo.provider.isSynced);
    let closed = false;
    mo.provider.on("close", () => { closed = true; });

    await removeMembership(world.ours.id, world.member, world.admin);

    await until(() => closed);
  });
});

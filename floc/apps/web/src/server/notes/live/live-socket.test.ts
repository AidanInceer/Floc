/**
 * The socket end to end (#391): a real HTTP server, a real provider, two
 * people in one trip's Notes.
 */
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import WebSocket from "ws";
import * as Y from "yjs";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { handOverAndLeaveAllTrips, removeMembership } from "@/server/trips/roster";
import { softDeleteTrip } from "@/server/trips/trips";
import { db } from "@/db";
import { tripMembership } from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { attachNotesLive, LIVE_NOTES_PATH } from "./live-socket";
import { createNotesLive, notesDocumentName } from "./notes-live";

let world: Scenario;
let server: Server;
let url: string;
const open: HocuspocusProvider[] = [];
const sockets: HocuspocusProviderWebsocket[] = [];
const revokedSessions = new Set<string>();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  revokedSessions.clear();
  const live = createNotesLive({
    resolveUser: async (headers) => {
      const userId = headers.get("cookie");
      return userId && !revokedSessions.has(userId) ? userId : null;
    },
    debounce: 0,
  });
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

function connectAs(userId: string, tripId: number) {
  const WebSocketPolyfill = class extends WebSocket {
    constructor(address: string) {
      super(address, { headers: { cookie: userId } });
    }
  };
  const websocketProvider = new HocuspocusProviderWebsocket({ url, WebSocketPolyfill });
  const provider = new HocuspocusProvider({
    websocketProvider,
    name: notesDocumentName(tripId),
    token: "session",
  });
  provider.attach();
  open.push(provider);
  sockets.push(websocketProvider);
  return provider;
}

const until = (check: () => boolean) =>
  new Promise<void>((done, fail) => {
    const started = Date.now();
    const tick = () =>
      check() ? done() : Date.now() - started > 4_000 ? fail(new Error("timed out")) : setTimeout(tick, 20);
    tick();
  });

// A plain map, not the Notes fragment: this proves the pipe, not BlockNote's shape.
const write = (doc: Y.Doc, text: string) => doc.getMap("probe").set(text, true);
const read = (doc: Y.Doc) => [...doc.getMap("probe").keys()].sort().join(",");

describe("the live socket", () => {
  it.each(["session", "membership"])("rejects an edit after %s revocation without a kick", async (revoked) => {
    const ada = connectAs(world.admin, world.ours.id);
    const mo = connectAs(world.member, world.ours.id);
    await until(() => ada.isSynced && mo.isSynced);
    let closed = false;
    mo.on("close", () => { closed = true; });
    if (revoked === "session") revokedSessions.add(world.member);
    else await db.update(tripMembership).set({ deletedAt: new Date() }).where(
      and(eq(tripMembership.tripId, world.ours.id), eq(tripMembership.userId, world.member)),
    );

    write(mo.document, "forbidden edit");

    await until(() => closed);
    expect(read(ada.document)).not.toContain("forbidden edit");
  });

  it("closes every live editor when a trip is deleted", async () => {
    const ada = connectAs(world.admin, world.ours.id);
    const mo = connectAs(world.member, world.ours.id);
    await until(() => ada.isSynced && mo.isSynced);
    let closed = 0;
    ada.on("close", () => { closed++; });
    mo.on("close", () => { closed++; });

    await softDeleteTrip(world.ours.id);

    await until(() => closed === 2);
  });

  it("disconnects a member when account deletion removes their memberships", async () => {
    const ada = connectAs(world.admin, world.ours.id);
    const mo = connectAs(world.member, world.ours.id);
    await until(() => ada.isSynced && mo.isSynced);
    let disconnected = false;
    mo.on("close", () => { disconnected = true; });

    await handOverAndLeaveAllTrips(world.member);

    await until(() => disconnected);
    expect(sockets[0].status).toBe("connected");
  });

  it("carries one member's edit to another, and keeps both of two edits", async () => {
    const ada = connectAs(world.admin, world.ours.id);
    const mo = connectAs(world.member, world.ours.id);
    await until(() => ada.isSynced && mo.isSynced);

    write(ada.document, "Ada");
    write(mo.document, "Mo");

    await until(() => read(ada.document).includes("Mo") && read(mo.document).includes("Ada"));
    expect(read(ada.document)).toBe(read(mo.document));
  });

  it("carries a phone member's identity and cursor to the web", async () => {
    const web = connectAs(world.admin, world.ours.id);
    const phone = connectAs(world.member, world.ours.id);
    await until(() => web.isSynced && phone.isSynced);

    phone.awareness?.setLocalStateField("user", { id: world.member, name: "Phone member", tone: "who-2" });
    phone.awareness?.setLocalStateField("blockCursor", "plan");

    await until(() => [...(web.awareness?.getStates().values() ?? [])].some((state) => state.user?.id === world.member));
    expect([...(web.awareness?.getStates().values() ?? [])]).toContainEqual(
      expect.objectContaining({
        user: expect.objectContaining({ id: world.member, name: "Phone member" }),
        blockCursor: "plan",
      }),
    );
  });

  it("keeps edits made while disconnected and sends them on reconnect", async () => {
    const ada = connectAs(world.admin, world.ours.id);
    const mo = connectAs(world.member, world.ours.id);
    await until(() => ada.isSynced && mo.isSynced);

    sockets[1].disconnect();
    await until(() => sockets[1].status === "disconnected");
    write(mo.document, "on the train");
    expect(mo.hasUnsyncedChanges).toBe(true);

    await sockets[1].connect();
    await until(() => read(ada.document).includes("on the train"));
    await until(() => !mo.hasUnsyncedChanges);
  });

  it("refuses a non-member", async () => {
    let refused = "";
    const ozz = connectAs(world.outsider, world.ours.id);
    ozz.on("authenticationFailed", ({ reason }: { reason: string }) => (refused = reason));
    await until(() => refused !== "");
    expect(ozz.isSynced).toBe(false);
  });

  it("stops sending a removed member's edits on", async () => {
    const ada = connectAs(world.admin, world.ours.id);
    const mo = connectAs(world.member, world.ours.id);
    await until(() => ada.isSynced && mo.isSynced);
    write(mo.document, "before removal");
    await until(() => read(ada.document).includes("before removal"));

    await removeMembership(world.ours.id, world.member, world.admin);
    await new Promise((done) => setTimeout(done, 100));
    write(mo.document, "after removal");
    await new Promise((done) => setTimeout(done, 300));

    expect(read(ada.document)).not.toContain("after removal");
  });
});

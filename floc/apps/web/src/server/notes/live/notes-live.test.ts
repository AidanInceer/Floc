/**
 * Live Notes sync (#391): who may connect, how an old JSON doc becomes a Yjs
 * doc, what is stored, and that a removed member is dropped at once.
 */
import * as Y from "yjs";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { loadNoteDoc, saveNoteDoc } from "@/server/notes/note-doc";
import { removeMembership } from "@/server/trips/roster";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { createNotesLive, notesDocumentName } from "./notes-live";
import { blocksJson, NOTES_FRAGMENT } from "./live-doc";
import { loadLiveState } from "./live-store";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const doc = (text: string) =>
  JSON.stringify([
    {
      id: "b1",
      type: "paragraph",
      props: { backgroundColor: "default", textColor: "default", textAlignment: "left" },
      content: [{ type: "text", text, styles: {} }],
      children: [],
    },
  ]);

const texts = (json: string) =>
  (JSON.parse(json) as { content: { text: string }[] }[]).map((b) =>
    b.content.map((c) => c.text).join(""),
  );

function liveAs(userId: string | null) {
  return createNotesLive({ resolveUser: async () => userId, debounce: 0 });
}

async function authenticate(live: ReturnType<typeof liveAs>, documentName: string) {
  const context: Record<string, unknown> = {};
  await live.hooks("onAuthenticate", {
    context,
    documentName,
    requestHeaders: new Headers(),
  } as never);
  return context;
}

describe("who may connect", () => {
  it("lets a trip member in", async () => {
    const ctx = await authenticate(liveAs(world.member), notesDocumentName(world.ours.id));
    expect(ctx.userId).toBe(world.member);
  });

  it("refuses a signed-out person", async () => {
    await expect(authenticate(liveAs(null), notesDocumentName(world.ours.id))).rejects.toThrow();
  });

  it("refuses a member of another trip, the same as a trip that does not exist", async () => {
    const outsider = liveAs(world.outsider);
    const theirs = authenticate(outsider, notesDocumentName(world.ours.id));
    const none = authenticate(outsider, notesDocumentName(999_999));
    await expect(theirs).rejects.toThrow("Not found");
    await expect(none).rejects.toThrow("Not found");
  });

  it("refuses a document name that is not a trip's Notes", async () => {
    await expect(authenticate(liveAs(world.member), "trip:abc")).rejects.toThrow("Not found");
    await expect(authenticate(liveAs(world.member), "other:1")).rejects.toThrow("Not found");
  });

  it("refuses a member who has left", async () => {
    await removeMembership(world.ours.id, world.member, world.member);
    await expect(
      authenticate(liveAs(world.member), notesDocumentName(world.ours.id)),
    ).rejects.toThrow("Not found");
  });
});

describe("loading and storing", () => {
  it("seeds a live doc from the saved JSON without losing content", async () => {
    await saveNoteDoc(world.ours.id, world.admin, doc("Kyoto in April"));
    const live = liveAs(world.admin);
    const conn = await live.openDirectConnection(notesDocumentName(world.ours.id), {
      userId: world.admin,
    });

    expect(texts(blocksJson(conn.document!))).toEqual(["Kyoto in April"]);
    await conn.disconnect();
  });

  it("starts a trip with no Notes from one empty paragraph, so editors share one root", async () => {
    const conn = await liveAs(world.admin).openDirectConnection(notesDocumentName(world.ours.id), {
      userId: world.admin,
    });
    expect(conn.document!.getXmlFragment(NOTES_FRAGMENT).length).toBe(1);
    expect(texts(blocksJson(conn.document!))).toEqual([""]);
    await conn.disconnect();
  });

  it("stores the Yjs state and a JSON copy after a change", async () => {
    const live = liveAs(world.admin);
    const name = notesDocumentName(world.ours.id);
    const conn = await live.openDirectConnection(name, { userId: world.admin });
    await conn.transact((d) => {
      const para = new Y.XmlElement("paragraph");
      para.insert(0, [new Y.XmlText("Pack sun cream")]);
      const container = new Y.XmlElement("blockContainer");
      container.setAttribute("id", "x1");
      container.insert(0, [para]);
      const group = new Y.XmlElement("blockGroup");
      group.insert(0, [container]);
      d.getXmlFragment(NOTES_FRAGMENT).insert(0, [group]);
    });
    await conn.disconnect();

    const stored = await loadLiveState(world.ours.id);
    expect(stored.state).not.toBeNull();
    expect(texts(stored.body!)).toEqual(["Pack sun cream"]);
    expect(texts((await loadNoteDoc(world.ours.id))!)).toEqual(["Pack sun cream"]);
  });

  it("reopens from the stored Yjs state", async () => {
    const name = notesDocumentName(world.ours.id);
    await saveNoteDoc(world.ours.id, world.admin, doc("first"));
    const first = await liveAs(world.admin).openDirectConnection(name, { userId: world.admin });
    await first.transact(() => {});
    await first.disconnect();

    const again = await liveAs(world.admin).openDirectConnection(name, { userId: world.admin });
    expect(texts(blocksJson(again.document!))).toEqual(["first"]);
    await again.disconnect();
  });

  it("a whole-document save drops the Yjs state, so the next open reseeds from it", async () => {
    const name = notesDocumentName(world.ours.id);
    const conn = await liveAs(world.admin).openDirectConnection(name, { userId: world.admin });
    await conn.transact(() => {});
    await conn.disconnect();

    await saveNoteDoc(world.ours.id, world.admin, doc("from the phone"));
    expect((await loadLiveState(world.ours.id)).state).toBeNull();
  });
});

describe("removal kick", () => {
  it("closes a removed member's connections and keeps the rest", async () => {
    const live = liveAs(world.member);
    const name = notesDocumentName(world.ours.id);
    const closed: string[] = [];
    const fake = (userId: string) => ({
      context: { userId },
      messageAddress: name,
      send: () => {},
      close: () => closed.push(userId),
    });
    await live.openDirectConnection(name, { userId: world.admin });
    const document = live.documents.get(name)!;
    document.addConnection(fake(world.member) as never);
    document.addConnection(fake(world.admin) as never);

    await removeMembership(world.ours.id, world.member, world.admin);

    expect(closed).toEqual([world.member]);
  });
});

/**
 * Live notes pages (#391, #408): who may open which doc, how a page is seeded
 * and stored, and that archived pages and removed members are dropped at once.
 */
import * as Y from "yjs";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { tripPage } from "@/db/schema";
import { pageDocumentName, pagesDocumentName } from "@floc/core/notes/live/live-names";
import { readEpoch } from "@floc/core/notes/live/live-epoch";
import { parsePageBody, serialisePage, type PageBlock } from "@floc/core/notes/pages/page-blocks";
import { PAGE_FRAGMENT, readPageYjs } from "@floc/core/notes/pages/page-yjs";
import { archivePage, createPage } from "@/server/notes/pages/pages";
import { loadPages } from "@/server/notes/pages/pages-read";
import { removeMembership } from "@/server/trips/roster";
import { softDeleteTrip } from "@/server/trips/trips";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { createNotesLive } from "./notes-live";
import { loadPageEpoch } from "./live-epoch-store";
import { loadPageState, storePageState } from "./page-live-store";

let world: Scenario;
let pageId: number;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  pageId = (await loadPages(world.ours.id, world.admin)).pages[0].id;
});

const lines = (text: string): PageBlock[] => [{ type: "paragraph", indent: 0, content: [{ type: "text", text }] }];
const texts = (blocks: PageBlock[]) => blocks.map((block) => (block.type === "paragraph" ? block.content.map((run) => (run.type === "text" ? run.text : "")).join("") : block.type));

function liveAs(userId: string | null) {
  return createNotesLive({ resolveUser: async () => userId, debounce: 0 });
}

async function authenticate(live: ReturnType<typeof liveAs>, documentName: string) {
  const context: Record<string, unknown> = {};
  await live.hooks("onAuthenticate", { context, documentName, requestHeaders: new Headers() } as never);
  return context;
}

async function spare() {
  const made = await createPage(world.ours.id, world.member, null);
  if ("error" in made) throw new Error(made.error);
  return made.id;
}

describe("who may connect", () => {
  it("lets a trip member into a page and the trip's page list", async () => {
    expect((await authenticate(liveAs(world.member), pageDocumentName(world.ours.id, pageId))).userId).toBe(world.member);
    expect((await authenticate(liveAs(world.member), pagesDocumentName(world.ours.id))).userId).toBe(world.member);
  });

  it("refuses a signed-out person", async () => {
    await expect(authenticate(liveAs(null), pageDocumentName(world.ours.id, pageId))).rejects.toThrow();
  });

  it("refuses an outsider the same way for a real trip, a made-up one, and a page of another trip", async () => {
    const outsider = liveAs(world.outsider);
    await expect(authenticate(outsider, pageDocumentName(world.ours.id, pageId))).rejects.toThrow("Not found");
    await expect(authenticate(outsider, pagesDocumentName(999_999))).rejects.toThrow("Not found");
    await expect(authenticate(liveAs(world.member), pageDocumentName(world.theirs.id, pageId))).rejects.toThrow("Not found");
    const theirs = (await loadPages(world.theirs.id, world.outsider)).pages[0].id;
    await expect(authenticate(liveAs(world.member), pageDocumentName(world.ours.id, theirs))).rejects.toThrow("Not found");
  });

  it("refuses a name that is not a notes doc, and an archived page", async () => {
    await expect(authenticate(liveAs(world.member), "trip-notes:1")).rejects.toThrow("Not found");
    const page = await spare();
    await archivePage(world.ours.id, page, world.member);
    await expect(authenticate(liveAs(world.member), pageDocumentName(world.ours.id, page))).rejects.toThrow("Not found");
  });

  it("refuses a member who has left", async () => {
    await removeMembership(world.ours.id, world.member, world.member);
    await expect(authenticate(liveAs(world.member), pageDocumentName(world.ours.id, pageId))).rejects.toThrow("Not found");
  });
});

describe("checking a connection while it talks", () => {
  it("re-checks at most once a minute, not on every keystroke", async () => {
    let asked = 0;
    const live = createNotesLive({
      resolveUser: async () => {
        asked += 1;
        return world.member;
      },
      debounce: 0,
    });
    const documentName = pageDocumentName(world.ours.id, pageId);
    const context = await authenticate(live, documentName);
    asked = 0;

    for (let i = 0; i < 5; i++) {
      await live.hooks("beforeHandleMessage", { context, documentName, requestHeaders: new Headers() } as never);
    }
    expect(asked).toBe(0);

    context.checkedAt = 0;
    await live.hooks("beforeHandleMessage", { context, documentName, requestHeaders: new Headers() } as never);
    expect(asked).toBe(1);
  });

  it("drops a member who has left once the check comes round", async () => {
    const live = liveAs(world.member);
    const documentName = pageDocumentName(world.ours.id, pageId);
    const context = await authenticate(live, documentName);
    await removeMembership(world.ours.id, world.member, world.admin);

    context.checkedAt = 0;
    await expect(
      live.hooks("beforeHandleMessage", { context, documentName, requestHeaders: new Headers() } as never),
    ).rejects.toThrow();
  });
});

describe("loading and storing a page", () => {
  it("seeds the live doc from the page's body, stamped with an epoch", async () => {
    await db.update(tripPage).set({ body: serialisePage(lines("Kyoto in April")) }).where(eq(tripPage.id, pageId));
    const conn = await liveAs(world.admin).openDirectConnection(pageDocumentName(world.ours.id, pageId), { userId: world.admin, checkedAt: Date.now() });
    expect(texts(readPageYjs(conn.document!))).toEqual(["Kyoto in April"]);
    expect(readEpoch(conn.document!)).not.toBeNull();
    await conn.disconnect();
  });

  it("stores the Yjs state and a readable body after a change, and reopens from the state", async () => {
    const name = pageDocumentName(world.ours.id, pageId);
    const conn = await liveAs(world.admin).openDirectConnection(name, { userId: world.admin, checkedAt: Date.now() });
    const epoch = readEpoch(conn.document!);
    await conn.transact((doc) => {
      const paragraph = new Y.XmlElement("paragraph");
      paragraph.insert(0, [new Y.XmlText("Pack sun cream")]);
      doc.getXmlFragment(PAGE_FRAGMENT).push([paragraph]);
    });
    await conn.disconnect();

    const stored = await loadPageState(pageId);
    expect(stored.state).not.toBeNull();
    expect(texts(parsePageBody(stored.body))).toEqual(["", "Pack sun cream"]);
    expect(await loadPageEpoch(pageId)).toBe(epoch);

    const again = await liveAs(world.admin).openDirectConnection(name, { userId: world.admin, checkedAt: Date.now() });
    expect(texts(readPageYjs(again.document!))).toEqual(["", "Pack sun cream"]);
    await again.disconnect();
  });

  it("does not store a page that was archived or whose trip was deleted meanwhile", async () => {
    const page = await spare();
    await archivePage(world.ours.id, page, world.member);
    await storePageState(world.ours.id, page, world.member, new Uint8Array([0, 0]), serialisePage(lines("too late")));
    expect((await loadPageState(page)).state).toBeNull();

    await softDeleteTrip(world.ours.id);
    await storePageState(world.ours.id, pageId, world.member, new Uint8Array([0, 0]), serialisePage(lines("too late")));
    expect((await loadPageState(pageId)).state).toBeNull();
  });

  it("does not store a page over 1 MB", async () => {
    await storePageState(world.ours.id, pageId, world.member, new Uint8Array([0, 0]), serialisePage(lines("x".repeat(1_000_001))));
    expect((await loadPageState(pageId)).state).toBeNull();
  });

  it("answers no epoch for a page never opened", async () => {
    expect(await loadPageEpoch(pageId)).toBeNull();
  });
});

describe("the page list channel", () => {
  it("tells open page lists that the list changed, and closes an archived page's editors", async () => {
    const live = liveAs(world.admin);
    const page = await spare();
    await live.openDirectConnection(pagesDocumentName(world.ours.id), { userId: world.admin, checkedAt: Date.now() });
    await live.openDirectConnection(pageDocumentName(world.ours.id, page), { userId: world.admin, checkedAt: Date.now() });
    const said: string[] = [];
    const closed: string[] = [];
    const fake = (tag: string) => ({ context: { userId: world.member }, messageAddress: tag, send: () => said.push(tag), close: () => closed.push(tag) });
    live.documents.get(pagesDocumentName(world.ours.id))!.addConnection(fake("list") as never);
    live.documents.get(pageDocumentName(world.ours.id, page))!.addConnection(fake("page") as never);

    await archivePage(world.ours.id, page, world.member);

    expect(said).toEqual(["list"]);
    expect(closed).toEqual(["page"]);
  });
});

describe("removal kick", () => {
  it("closes a removed member's connections on every doc of the trip, and keeps the rest", async () => {
    const live = liveAs(world.member);
    const closed: string[] = [];
    const fake = (userId: string) => ({ context: { userId }, messageAddress: userId, send: () => {}, close: () => closed.push(userId) });
    for (const name of [pageDocumentName(world.ours.id, pageId), pagesDocumentName(world.ours.id)]) {
      await live.openDirectConnection(name, { userId: world.admin, checkedAt: Date.now() });
      live.documents.get(name)!.addConnection(fake(world.member) as never);
      live.documents.get(name)!.addConnection(fake(world.admin) as never);
    }

    await removeMembership(world.ours.id, world.member, world.admin);

    expect(closed).toEqual([world.member, world.member]);
  });
});

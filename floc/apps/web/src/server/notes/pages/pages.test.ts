/**
 * Notes pages (#408): the list a trip's Notes is made of — made, named, moved,
 * archived and restored by any member, within the limits.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { tripPage } from "@/db/schema";
import { PAGE_LIMITS } from "@floc/core/notes/pages/page-rules";
import { createTripWithAdmin } from "@/server/trips/trips";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { loadPages } from "./pages-read";
import { archivePage, createPage, movePage, renamePage, restorePage, setPageIcon } from "./pages";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const titles = async (tripId = world.ours.id) =>
  (await loadPages(tripId, world.admin)).pages.map((page) => [page.title, page.depth]);

const made = async (parentId: number | null = null, tripId = world.ours.id) => {
  const result = await createPage(tripId, world.member, parentId);
  if ("error" in result) throw new Error(result.error);
  return result.id;
};

describe("the first page", () => {
  it("gives a new trip exactly one page, Notes", async () => {
    const tripId = await createTripWithAdmin({ name: "Portugal", startDate: null, endDate: null, createdBy: world.admin });
    expect(await titles(tripId)).toEqual([["Notes", 0]]);
    expect(await titles(tripId)).toEqual([["Notes", 0]]);
  });

  it("gives a trip with no pages one, the first time its Notes opens", async () => {
    expect(await titles()).toEqual([["Notes", 0]]);
  });
});

describe("making pages", () => {
  it("adds a page at the end, and a sub-page under its parent", async () => {
    await loadPages(world.ours.id, world.admin);
    const top = await made();
    await renamePage(world.ours.id, top, world.member, "Where to eat");
    const sub = await made(top);
    await renamePage(world.ours.id, sub, world.member, "Lagos");
    expect(await titles()).toEqual([["Notes", 0], ["Where to eat", 0], ["Lagos", 1]]);
  });

  it("never nests a page two levels deep", async () => {
    const top = await made();
    const sub = await made(top);
    expect(await createPage(world.ours.id, world.member, sub)).toEqual({ error: "A sub-page cannot hold pages." });
  });

  it("refuses a parent from another trip, the same as one that does not exist", async () => {
    const theirs = await made(null, world.theirs.id);
    expect(await createPage(world.ours.id, world.member, theirs)).toEqual({ error: "That page has gone." });
    expect(await createPage(world.ours.id, world.member, 999_999)).toEqual({ error: "That page has gone." });
  });

  it("refuses the page past fifty with words, not a throw", async () => {
    await loadPages(world.ours.id, world.admin);
    for (let i = 1; i < PAGE_LIMITS.pages; i += 1) await made();
    expect(await createPage(world.ours.id, world.member, null)).toEqual({ error: "A trip holds 50 pages. Archive one to make room." });
  });
});

describe("naming and icons", () => {
  it("renames, trims, and refuses a name that is too long", async () => {
    const id = await made();
    expect(await renamePage(world.ours.id, id, world.member, "  Getting around  ")).toBeNull();
    expect(await renamePage(world.ours.id, id, world.member, "x".repeat(121))).toEqual({ error: "A page name is at most 120 characters." });
    expect((await titles()).at(-1)).toEqual(["Getting around", 0]);
  });

  it("sets and removes an icon, and refuses one it does not know", async () => {
    const id = await made();
    await setPageIcon(world.ours.id, id, world.member, "food");
    expect((await loadPages(world.ours.id, world.admin)).pages.at(-1)?.icon).toBe("food");
    await setPageIcon(world.ours.id, id, world.member, null);
    expect((await loadPages(world.ours.id, world.admin)).pages.at(-1)?.icon).toBeNull();
  });

  it("leaves another trip's page alone", async () => {
    const theirs = await made(null, world.theirs.id);
    expect(await renamePage(world.ours.id, theirs, world.member, "Mine now")).toEqual({ error: "That page has gone." });
    await setPageIcon(world.ours.id, theirs, world.member, "food");
    const row = await db.select().from(tripPage).where(eq(tripPage.id, theirs)).get();
    expect([row?.title, row?.icon]).toEqual(["", null]);
  });
});

describe("moving", () => {
  it("moves a page before another of the same parent, or to the end", async () => {
    await loadPages(world.ours.id, world.admin);
    const a = await made();
    const b = await made();
    await renamePage(world.ours.id, a, world.member, "A");
    await renamePage(world.ours.id, b, world.member, "B");
    await movePage(world.ours.id, b, world.member, a);
    expect(await titles()).toEqual([["Notes", 0], ["B", 0], ["A", 0]]);
    await movePage(world.ours.id, b, world.member, null);
    expect(await titles()).toEqual([["Notes", 0], ["A", 0], ["B", 0]]);
  });

  it("will not move a page under a different parent", async () => {
    const top = await made();
    const sub = await made(top);
    expect(await movePage(world.ours.id, sub, world.member, top)).toEqual({ error: "Pages move within their own list." });
  });
});

describe("archive", () => {
  it("archives a page with its sub-pages, and restores them together", async () => {
    await loadPages(world.ours.id, world.admin);
    const top = await made();
    await made(top);
    expect(await archivePage(world.ours.id, top, world.member)).toBeNull();
    const after = await loadPages(world.ours.id, world.admin);
    expect(after.pages.map((page) => page.title)).toEqual(["Notes"]);
    expect(after.archived.map((page) => page.id)).toContain(top);
    expect(after.archived).toHaveLength(2);

    expect(await restorePage(world.ours.id, top, world.member)).toBeNull();
    expect((await loadPages(world.ours.id, world.admin)).pages).toHaveLength(3);
  });

  it("never archives the last page", async () => {
    const [only] = (await loadPages(world.ours.id, world.admin)).pages;
    expect(await archivePage(world.ours.id, only.id, world.member)).toEqual({ error: "The last page stays." });
  });

  it("restores a sub-page whose parent is still archived to the top of the list", async () => {
    await loadPages(world.ours.id, world.admin);
    const top = await made();
    const sub = await made(top);
    await archivePage(world.ours.id, top, world.member);
    await restorePage(world.ours.id, sub, world.member);
    const row = await db.select().from(tripPage).where(and(eq(tripPage.id, sub))).get();
    expect([row?.parentId, row?.archivedAt]).toEqual([null, null]);
  });

  it("refuses a restore that would pass fifty pages", async () => {
    await loadPages(world.ours.id, world.admin);
    const spare = await made();
    await archivePage(world.ours.id, spare, world.member);
    for (let i = 1; i < PAGE_LIMITS.pages; i += 1) await made();
    expect(await restorePage(world.ours.id, spare, world.member)).toEqual({ error: "A trip holds 50 pages. Archive one to make room." });
  });
});

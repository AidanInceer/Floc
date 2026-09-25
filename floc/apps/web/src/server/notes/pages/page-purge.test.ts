/** The 7-day archive (#408, ADR-017): what goes, and everything that must stay. */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { note, noteReaction, tripPage } from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { purgeArchivedPages } from "./page-purge";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-01T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY);

async function page(tripId: number, archivedAt: Date | null, parentId: number | null = null) {
  const row = await db.insert(tripPage).values({ tripId, parentId, archivedAt, body: "{}", updatedBy: world.admin }).returning({ id: tripPage.id }).get();
  return row.id;
}

async function comment(tripId: number, pageId: number, scope: "page" | "day" = "page") {
  const row = await db.insert(note).values({ tripId, createdBy: world.member, scope, scopeId: pageId, body: "Only if two of us can drive" }).returning({ id: note.id }).get();
  await db.insert(noteReaction).values({ noteId: row.id, userId: world.admin, kind: "heart" });
  return row.id;
}

const pageIds = async () => (await db.select({ id: tripPage.id }).from(tripPage).all()).map((row) => row.id).sort((a, b) => a - b);

describe("purgeArchivedPages", () => {
  it("deletes a page archived a week ago, with its sub-pages and comments, and nothing else", async () => {
    const old = await page(world.ours.id, ago(7));
    const oldSub = await page(world.ours.id, ago(7), old);
    const recent = await page(world.ours.id, ago(6));
    const live = await page(world.ours.id, null);
    const theirs = await page(world.theirs.id, ago(30));
    const gone = await comment(world.ours.id, oldSub);
    const kept = await comment(world.ours.id, live);
    const dayComment = await comment(world.ours.id, old, "day");

    expect(await purgeArchivedPages(now)).toBe(3);

    expect(await pageIds()).toEqual([recent, live].sort((a, b) => a - b));
    expect(theirs).toBeGreaterThan(0);
    const notes = (await db.select({ id: note.id }).from(note).all()).map((row) => row.id);
    expect(notes).toEqual(expect.arrayContaining([kept, dayComment]));
    expect(notes).not.toContain(gone);
    expect(await db.select().from(noteReaction).where(eq(noteReaction.noteId, gone)).all()).toEqual([]);
  });

  it("keeps a sub-page restored on its own, lifted to the top", async () => {
    const old = await page(world.ours.id, ago(8));
    const restored = await page(world.ours.id, null, old);
    await purgeArchivedPages(now);
    expect(await db.select({ parentId: tripPage.parentId }).from(tripPage).where(eq(tripPage.id, restored)).get()).toEqual({ parentId: null });
  });

  it("does nothing when nothing is due", async () => {
    await page(world.ours.id, ago(1));
    expect(await purgeArchivedPages(now)).toBe(0);
  });
});

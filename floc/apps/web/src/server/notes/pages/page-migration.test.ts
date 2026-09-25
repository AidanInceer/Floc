/**
 * The move off BlockNote, on production-shaped Notes docs (#408): what BlockNote
 * 0.54 wrote, props and all, nested lists, a table in both cell shapes, links.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { tripNoteDoc, tripPage } from "@/db/schema";
import { parsePageBody } from "@floc/core/notes/pages/page-blocks";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { movePagesOffBlockNote } from "./page-migration";
import { loadPages } from "./pages-read";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const props = { backgroundColor: "default", textColor: "default", textAlignment: "left" };
const run = (text: string, styles: Record<string, unknown> = {}) => ({ type: "text", text, styles });
const PRODUCTION_SHAPED = JSON.stringify([
  { id: "1", type: "heading", props: { ...props, level: 1, isToggleable: false }, content: [run("Portugal")], children: [] },
  { id: "2", type: "paragraph", props, content: [run("Lisbon first, then "), run("Lagos", { bold: true }), run(".")], children: [] },
  { id: "3", type: "checkListItem", props: { ...props, checked: true }, content: [run("Flights")], children: [
    { id: "4", type: "checkListItem", props: { ...props, checked: false }, content: [run("Seats together")], children: [] },
  ] },
  { id: "5", type: "bulletListItem", props, content: [{ type: "link", href: "https://www.cp.pt", content: [run("Train times")] }], children: [] },
  { id: "6", type: "table", props: { textColor: "default" }, content: {
    type: "tableContent", columnWidths: [null, null], headerRows: 1,
    rows: [
      { cells: [{ type: "tableCell", props: { backgroundColor: "default", textColor: "default", textAlignment: "left", colspan: 1, rowspan: 1 }, content: [run("Place")] }, { type: "tableCell", props: { backgroundColor: "yellow" }, content: [run("Booked")] }] },
      { cells: [[run("Taberna")], [run("Yes")]] },
    ],
  }, children: [] },
  { id: "7", type: "paragraph", props, content: [], children: [] },
]);

describe("moving Notes off BlockNote", () => {
  it("makes each old doc a Notes page with every word, tick and table, and leaves the old row alone", async () => {
    await db.insert(tripNoteDoc).values({ tripId: world.ours.id, updatedBy: world.member, body: PRODUCTION_SHAPED });
    const report = await movePagesOffBlockNote();
    expect(report).toEqual({ docs: 1, moved: 1, lostText: [] });

    const [page] = (await loadPages(world.ours.id, world.admin)).pages;
    expect(page.title).toBe("Notes");
    const row = await db.select().from(tripPage).where(eq(tripPage.id, page.id)).get();
    const blocks = parsePageBody(row?.body);
    expect(blocks.map((block) => block.type)).toEqual(["heading", "paragraph", "check", "check", "bullet", "table", "paragraph"]);
    expect(blocks[3]).toMatchObject({ indent: 1, checked: false });
    expect(blocks[5]).toMatchObject({ header: true, rows: [[{ tone: null }, { tone: "butter" }], [{}, {}]] });
    expect(row?.yjsState).toBeNull();

    const old = await db.select().from(tripNoteDoc).where(eq(tripNoteDoc.tripId, world.ours.id)).get();
    expect(old?.body).toBe(PRODUCTION_SHAPED);
  });

  it("does nothing the second time, or to a trip that already has pages", async () => {
    await db.insert(tripNoteDoc).values({ tripId: world.ours.id, updatedBy: world.member, body: PRODUCTION_SHAPED });
    await movePagesOffBlockNote();
    expect(await movePagesOffBlockNote()).toEqual({ docs: 1, moved: 0, lostText: [] });
    expect((await loadPages(world.ours.id, world.admin)).pages).toHaveLength(1);
  });

  it("moves an old doc the first time Notes opens, too, and only once when two open at once", async () => {
    await db.insert(tripNoteDoc).values({ tripId: world.ours.id, updatedBy: world.member, body: PRODUCTION_SHAPED });
    const [one, two] = await Promise.all([loadPages(world.ours.id, world.admin), loadPages(world.ours.id, world.member)]);
    expect([one.pages.length, two.pages.length]).toEqual([1, 1]);
    expect(await db.select().from(tripPage).where(eq(tripPage.tripId, world.ours.id)).all()).toHaveLength(1);
  });
});

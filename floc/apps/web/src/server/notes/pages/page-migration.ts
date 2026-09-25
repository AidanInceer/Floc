/**
 * The one-off move off BlockNote (#408): every trip with an old Notes doc and
 * no pages gets that doc as its first page, then each move is checked word for
 * word. Adds rows only; `trip_note_doc` is read, never changed. Safe to run
 * twice — a trip that already has a page is left alone.
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripNoteDoc, tripPage } from "@/db/schema";
import { blockNoteText } from "@floc/core/notes/pages/from-blocknote";
import { pageText, parsePageBody } from "@floc/core/notes/pages/page-blocks";
import { ensureFirstPage, FIRST_PAGE_TITLE } from "./page-first";

export type MoveReport = { docs: number; moved: number; lostText: number[] };

export async function movePagesOffBlockNote(): Promise<MoveReport> {
  const docs = await db
    .select({ tripId: tripNoteDoc.tripId, body: tripNoteDoc.body, updatedBy: tripNoteDoc.updatedBy })
    .from(tripNoteDoc)
    .innerJoin(trip, eq(trip.id, tripNoteDoc.tripId))
    .where(and(isNull(tripNoteDoc.deletedAt), isNull(trip.deletedAt)))
    .all();
  const report: MoveReport = { docs: docs.length, moved: 0, lostText: [] };
  for (const doc of docs) {
    const before = await db.select({ id: tripPage.id }).from(tripPage).where(eq(tripPage.tripId, doc.tripId)).get();
    if (before) continue;
    await ensureFirstPage(doc.tripId, doc.updatedBy);
    report.moved += 1;
    const page = await db.select({ body: tripPage.body }).from(tripPage)
      .where(and(eq(tripPage.tripId, doc.tripId), eq(tripPage.title, FIRST_PAGE_TITLE))).get();
    const words = pageText(parsePageBody(page?.body ?? ""));
    if (!blockNoteText(doc.body).every((text) => words.includes(text))) report.lostText.push(doc.tripId);
  }
  return report;
}

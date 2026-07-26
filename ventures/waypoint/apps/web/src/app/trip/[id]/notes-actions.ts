"use server";

/**
 * Discussion threads, shared by every surface that has one.
 *
 * These go through the polymorphic `note` table (scope + scope_id) rather than
 * a table per surface: a note on an idea and a note on a day event are the same
 * object with the same rules, and the alternative is `idea_comment`,
 * `day_event_comment`, … each with its own read, action and component. Nothing
 * here is scope-specific, which is the sign it was the right table.
 *
 * Not admin-gated: anyone in the trip can say something, and deleting follows
 * `deleteIdea`'s rule — your own, or any admin's, so a thread can't be held
 * hostage by someone who's gone quiet.
 */
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { note, type NoteScope } from "@/db/schema";
import { assertAdmin, requireTripAccess } from "@/lib/access";
import { touch } from "@/lib/unlocks";

/**
 * Which tab a scope is rendered on. Revalidating the layout alone left the tab
 * you were looking at showing the old thread until a manual reload — the client
 * router cache for that page isn't refreshed unless the revalidated path is the
 * page's own. So name it.
 */
function pathFor(tripId: number, scope: NoteScope): string {
  switch (scope) {
    case "idea":
      return `/trip/${tripId}/ideas`;
    case "day_event":
    case "day":
      return `/trip/${tripId}/days`;
    case "expense":
      return `/trip/${tripId}/money`;
    case "trip":
      return `/trip/${tripId}/overview`;
  }
}

export async function addNote(
  tripId: number,
  scope: NoteScope,
  scopeId: number,
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  const access = await requireTripAccess(tripId);
  await db.insert(note).values({
    tripId,
    createdBy: access.viewer.id,
    scope,
    scopeId,
    body: body.slice(0, 2000),
  });

  revalidatePath(pathFor(tripId, scope));
}

export async function deleteNote(tripId: number, noteId: number) {
  const access = await requireTripAccess(tripId);
  const row = await db
    .select({ createdBy: note.createdBy, scope: note.scope })
    .from(note)
    .where(
      and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)),
    )
    .get();
  if (!row) return;

  if (row.createdBy !== access.viewer.id) assertAdmin(access);

  await db
    .update(note)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(note.id, noteId));

  revalidatePath(pathFor(tripId, row.scope));
}

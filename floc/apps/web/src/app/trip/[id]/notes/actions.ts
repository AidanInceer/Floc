"use server";

// Server action for the Notes doc (ticket 238).
import { TEXT_CAPS } from "@floc/core/text";
import { requireTripAccess } from "@/server/access";
import { saveNoteDoc } from "@/server/notes/note-doc";

/**
 * Replace the whole document. No revalidate: the editor already holds what it
 * just sent, and re-rendering the page under it would fight the caret.
 */
export async function saveNotes(tripId: number, body: string) {
  const access = await requireTripAccess(tripId);
  if (body.length > TEXT_CAPS.noteDoc) throw new Error("That document is too long");

  await saveNoteDoc(access.trip.id, access.viewer.id, body);
}

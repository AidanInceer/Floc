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
import {
  note,
  noteReaction,
  type NoteScope,
  type ReactionKind,
} from "@/db/schema";
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

/**
 * Rewrite your own comment — for the typo you spot after posting.
 *
 * **Author only, and deliberately not an admin power.** Admin powers are
 * exactly four (rule 6) and this isn't one of them: an admin can *delete* a
 * comment, which is unambiguous, but putting different words in someone's
 * mouth under their own name is a different act entirely.
 *
 * Rule 7's last-write-wins means two people editing can't happen anyway — only
 * the author can, and there is one of them.
 */
export async function editNote(
  tripId: number,
  noteId: number,
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "A comment can't be empty — delete it instead." };

  const access = await requireTripAccess(tripId);
  const row = await db
    .select({ createdBy: note.createdBy, scope: note.scope, body: note.body })
    .from(note)
    .where(
      and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)),
    )
    .get();
  if (!row) return { error: "That comment has gone." };
  if (row.createdBy !== access.viewer.id) {
    return { error: "You can only edit your own comments." };
  }

  const next = body.slice(0, 2000);
  // Reopening the editor and saving the same words shouldn't stamp "edited" on
  // a comment nobody changed.
  if (next === row.body) return;

  await db
    .update(note)
    .set({ body: next, editedAt: new Date(), ...touch() })
    .where(eq(note.id, noteId));

  revalidatePath(pathFor(tripId, row.scope));
}

export async function addNote(
  tripId: number,
  scope: NoteScope,
  scopeId: number,
  /** The comment being replied to, or null for a new top-level comment. */
  replyTo: number | null,
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  const access = await requireTripAccess(tripId);

  /**
   * Threads are exactly one level deep (ticket 06). Replying to a reply
   * attaches to that reply's own parent, so the shape can't drift however the
   * UI evolves — and the parent is re-read here rather than trusted from the
   * form, which is also what stops a crafted `replyTo` pointing at a comment
   * in someone else's trip.
   */
  let parentId: number | null = null;
  if (replyTo !== null) {
    const target = await db
      .select({ id: note.id, parentId: note.parentId })
      .from(note)
      .where(
        and(
          eq(note.id, replyTo),
          eq(note.tripId, tripId),
          eq(note.scope, scope),
          eq(note.scopeId, scopeId),
          isNull(note.deletedAt),
        ),
      )
      .get();
    if (!target) return { error: "That comment has gone." };
    parentId = target.parentId ?? target.id;
  }

  await db.insert(note).values({
    tripId,
    createdBy: access.viewer.id,
    scope,
    scopeId,
    parentId,
    body: body.slice(0, 2000),
  });

  revalidatePath(pathFor(tripId, scope));
}

/**
 * Toggle one of the three reactions on a comment. Independent of each other by
 * design (ticket 06) — a comment can be both hearted and agreed with, and
 * policing thumbs-up-plus-thumbs-down costs more than the case is worth.
 *
 * Soft-delete (rule 8) means un-reacting has to revive the same row rather
 * than insert a second one, so this upserts by hand.
 */
export async function react(
  tripId: number,
  noteId: number,
  kind: ReactionKind,
) {
  const access = await requireTripAccess(tripId);

  const target = await db
    .select({ scope: note.scope })
    .from(note)
    .where(
      and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)),
    )
    .get();
  if (!target) return;

  const existing = await db
    .select({ id: noteReaction.id, deletedAt: noteReaction.deletedAt })
    .from(noteReaction)
    .where(
      and(
        eq(noteReaction.noteId, noteId),
        eq(noteReaction.userId, access.viewer.id),
        eq(noteReaction.kind, kind),
      ),
    )
    .get();

  if (!existing) {
    await db
      .insert(noteReaction)
      .values({ noteId, userId: access.viewer.id, kind });
  } else {
    await db
      .update(noteReaction)
      .set({ deletedAt: existing.deletedAt ? null : new Date(), ...touch() })
      .where(eq(noteReaction.id, existing.id));
  }

  revalidatePath(pathFor(tripId, target.scope));
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

  const deletedAt = new Date();
  await db
    .update(note)
    .set({ deletedAt, ...touch() })
    .where(eq(note.id, noteId));

  /**
   * A reply is only legible under the comment it answers, so deleting a
   * top-level comment takes its replies with it rather than leaving them
   * stranded as top-level comments answering nothing. One level deep means
   * this needs no recursion. The confirm copy says so before it happens.
   */
  await db
    .update(note)
    .set({ deletedAt, ...touch() })
    .where(and(eq(note.parentId, noteId), isNull(note.deletedAt)));

  revalidatePath(pathFor(tripId, row.scope));
}

/**
 * The port's event-comments half (ticket 325).
 *
 * SAME TABLE, SAME RULES AS THE WEB'S THREAD. Every read and write here goes
 * through `server/notes/`, which the Days page already uses — so a comment
 * posted from a phone and one typed in a browser are the same row, one level
 * deep, with the same cap on the body and the same answer to "may I delete
 * this". There is no second set of rules to drift.
 *
 * THE EVENT IS RESOLVED, NEVER TRUSTED. `access.event` binds the id to this
 * trip, so another trip's event is not addressable rather than merely refused
 * (ticket 106) — which also stops a crafted `dayEventId` reading a thread the
 * viewer has no trip in.
 *
 * DATES CROSS AS ISO STRINGS. A comment's time is a record of when somebody
 * typed, not an itinerary time, so rule 10 does not apply — but a `Date` does
 * not survive JSON, so it is stringified at the seam rather than at the screen.
 */
import "server-only";

import type { Comment, FlocPort, ReactionKind } from "@floc/api/port";
import type { NoteRow } from "@floc/core/notes/notes";

import { scoped } from "@/server/api-port/api-port-scope";
import { loadThreads } from "@/server/notes/notes-read";
import {
  findNote,
  insertNote,
  resolveParent,
  softDeleteNoteAndReplies,
  toggleReaction,
  updateNoteBody,
  NOTE_BODY_MAX,
} from "@/server/notes/notes";
import { refresh } from "@/server/freshness";

type CommentsPort = Pick<
  FlocPort,
  | "listEventComments"
  | "addEventComment"
  | "editComment"
  | "deleteComment"
  | "reactToComment"
>;

export function toComment(row: NoteRow): Comment {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    authorName: row.authorName,
    authorAvatarIcon: row.authorAvatarIcon,
    reactions: row.reactions,
    replies: row.replies.map(toComment),
  };
}

export const commentsPort: CommentsPort = {
  async listEventComments(viewerId, tripId, dayEventId): Promise<Comment[]> {
    const access = await scoped(viewerId, tripId);
    const event = await access.event(dayEventId);

    // `loadThreads` reads the trip's whole `day_event` scope in one query,
    // which is the shape the Days page wants; a phone shows one event, so it
    // takes its own run out of the map and drops the rest.
    const byEvent = await loadThreads({
      tripId: access.trip.id,
      scope: "day_event",
      viewerId: access.viewer.id,
      // No tones: the phone already has the roster and colours its own faces.
      toneOf: new Map(),
    });

    return (byEvent.get(event.id) ?? []).map(toComment);
  },

  async addEventComment(viewerId, tripId, dayEventId, replyTo, body) {
    const access = await scoped(viewerId, tripId);
    const event = await access.event(dayEventId);

    let parentId: number | null = null;
    if (replyTo !== null) {
      // undefined means the target has gone; null means "attach at the top".
      const resolved = await resolveParent({
        tripId: access.trip.id,
        scope: "day_event",
        scopeId: event.id,
        replyTo,
      });
      if (resolved === undefined) return "That comment has gone.";
      parentId = resolved;
    }

    await insertNote({
      tripId: access.trip.id,
      createdBy: access.viewer.id,
      scope: "day_event",
      scopeId: event.id,
      parentId,
      body,
    });

    refresh({ kind: "thread", tripId: access.trip.id, scope: "day_event" });
    return null;
  },

  async editComment(viewerId, tripId, commentId, body) {
    const access = await scoped(viewerId, tripId);
    const row = await findNote(access.trip.id, commentId);
    if (!row) return "That comment has gone.";
    // Author only, deliberately not an admin power (rule 6).
    if (row.createdBy !== access.viewer.id) {
      return "You can only edit your own comments.";
    }

    if (body.slice(0, NOTE_BODY_MAX) === row.body) return null;

    await updateNoteBody(row.id, body);
    refresh({ kind: "thread", tripId: access.trip.id, scope: row.scope });
    return null;
  },

  async deleteComment(viewerId, tripId, commentId) {
    const access = await scoped(viewerId, tripId);
    const row = await findNote(access.trip.id, commentId);
    if (!row) return;

    if (row.createdBy !== access.viewer.id) {
      throw new Error("You can only delete your own comments.");
    }

    await softDeleteNoteAndReplies(row.id);
    refresh({ kind: "thread", tripId: access.trip.id, scope: row.scope });
  },

  async reactToComment(viewerId, tripId, commentId, kind: ReactionKind) {
    const access = await scoped(viewerId, tripId);
    const row = await findNote(access.trip.id, commentId);
    if (!row) return;

    await toggleReaction(row.id, access.viewer.id, kind);
    refresh({ kind: "thread", tripId: access.trip.id, scope: row.scope });
  },
};

import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import type { Comment, FlocPort, ReactionKind } from "@floc/api/port";
import type { NoteRow } from "@floc/core/notes/notes";

import { scoped } from "@/server/api-port/api-port-scope";
import { loadThreads } from "@/server/notes/notes-read";
import { addThreadNote, deleteOwnNote, editOwnNote, reactToNote } from "@/server/notes/notes";

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
    authorTone: row.authorTone,
    reactions: row.reactions,
    replies: row.replies.map(toComment),
  };
}

export const commentsPort: CommentsPort = {
  async listEventComments(viewerId, tripId, dayEventId): Promise<Comment[]> {
    const access = await scoped(viewerId, tripId);
    const event = await access.event(dayEventId);

    const byEvent = await loadThreads({
      tripId: access.trip.id,
      scope: "day_event",
      viewerId: access.viewer.id,
      toneOf: new Map(access.members.map((member) => [member.userId, member.tone])),
    });

    return (byEvent.get(event.id) ?? []).map(toComment);
  },

  async addEventComment(viewerId, tripId, dayEventId, replyTo, body) {
    const access = await scoped(viewerId, tripId);
    const event = await access.event(dayEventId);

    return addThreadNote({
      tripId: access.trip.id,
      viewerId: access.viewer.id,
      scope: "day_event",
      scopeId: event.id,
      replyTo,
      body,
    });
  },

  async editComment(viewerId, tripId, commentId, body) {
    const access = await scoped(viewerId, tripId);
    return editOwnNote(access.trip.id, access.viewer.id, commentId, body);
  },

  async deleteComment(viewerId, tripId, commentId) {
    const access = await scoped(viewerId, tripId);
    const outcome = await deleteOwnNote(access.trip.id, access.viewer.id, commentId);
    if (outcome === "forbidden") {
      throw new Refusal("You can only delete your own comments.", "forbidden");
    }
  },

  async reactToComment(viewerId, tripId, commentId, kind: ReactionKind) {
    const access = await scoped(viewerId, tripId);
    await reactToNote(access.trip.id, access.viewer.id, commentId, kind);
  },
};

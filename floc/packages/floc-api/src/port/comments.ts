/** The comments half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { ReactionKind } from "@floc/core/vocabulary";
import type { Comment } from "../port-comment";

export type CommentsPort = {
  /**
   * One event's thread, oldest first, replies nested one level under their
   * parent. Scoped to the event rather than the trip: a phone opens one modal
   * at a time, and the whole trip's comments is a bigger read than it shows.
   */
  listEventComments(
    viewerId: string,
    tripId: number,
    dayEventId: number,
  ): Promise<Comment[]>;

  /**
   * Posts a comment, or a reply when `replyTo` names one. Returns the refusal
   * in the words the composer shows, or null when it landed. A reply to a
   * reply attaches to the same parent: the thread is one level deep by
   * design (#325), because it draws in a narrow panel.
   */
  addEventComment(
    viewerId: string,
    tripId: number,
    dayEventId: number,
    replyTo: number | null,
    body: string,
  ): Promise<string | null>;

  /** The author's own to do, deliberately not an admin power (rule 6). */
  editComment(
    viewerId: string,
    tripId: number,
    commentId: number,
    body: string,
  ): Promise<string | null>;

  /** Your own comment, or any comment if you are an admin. Replies go with it. */
  deleteComment(viewerId: string, tripId: number, commentId: number): Promise<void>;

  /** Toggles — reacting again takes the reaction back. */
  reactToComment(
    viewerId: string,
    tripId: number,
    commentId: number,
    kind: ReactionKind,
  ): Promise<void>;
};

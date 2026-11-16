import type { ReactionKind } from "@floc/core/vocabulary";
import type { Comment } from "../port-comment";

export type CommentsPort = {
  listEventComments(
    viewerId: string,
    tripId: number,
    dayEventId: number,
  ): Promise<Comment[]>;

  addEventComment(
    viewerId: string,
    tripId: number,
    dayEventId: number,
    replyTo: number | null,
    body: string,
  ): Promise<string | null>;

  editComment(
    viewerId: string,
    tripId: number,
    commentId: number,
    body: string,
  ): Promise<string | null>;

  deleteComment(viewerId: string, tripId: number, commentId: number): Promise<void>;

  reactToComment(
    viewerId: string,
    tripId: number,
    commentId: number,
    kind: ReactionKind,
  ): Promise<void>;
};

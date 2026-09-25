/** A comment as the API carries it — on an event (#325) or a notes page (#408). */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { ReactionKind } from "@floc/core/vocabulary";

/**
 * Replies are exactly one level deep, so a reply never carries replies of its own. `createdAt`
 * is an instant — when somebody typed, not an itinerary time.
 */
export type Comment = {
  id: number;
  body: string;
  createdAt: string;
  /** Set on the author's first self-edit; the client says "edited". */
  editedAt: string | null;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  reactions: Record<ReactionKind, { count: number; mine: boolean }>;
  replies: Comment[];
};

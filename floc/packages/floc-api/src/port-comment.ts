import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { ReactionKind } from "@floc/core/vocabulary";

export type Comment = {
  id: number;
  body: string;
  createdAt: string;
  editedAt: string | null;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  authorTone?: string;
  reactions: Record<ReactionKind, { count: number; mine: boolean }>;
  replies: Comment[];
};

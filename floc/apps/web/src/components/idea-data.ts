/**
 * The shape of an idea as the board renders it. Its own module because the card,
 * the byline and the discussion panel all take it, and hanging it off any one of
 * them makes the other two import that component to name their own props.
 */
import type { NoteRow } from "@floc/core/notes";
import type { VoteValue } from "@/db/schema";

type IdeaVoteRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  value: VoteValue;
  tone?: string;
};

export type IdeaCardData = {
  id: number;
  note: string;
  createdBy: string;
  authorName: string;
  authorAvatar: string | null;
  authorTone?: string; // absent if no longer a member; Avatar falls back to name
  createdAt: Date;
  pinnedAt: Date | null; // group-wide (ticket 09)
  votes: IdeaVoteRow[];
  notes: NoteRow[];
};

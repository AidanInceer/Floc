import type { AvatarIcon } from "../people/avatar-icon";
import { REACTION_KINDS, type ReactionKind } from "../vocabulary";

export type Reactions = Record<ReactionKind, { count: number; mine: boolean }>;

export type NoteRow = {
  id: number;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  authorTone?: string;
  reactions: Reactions;
  replies: NoteRow[];
};

export function likes(note: { reactions: Reactions }): { count: number; mine: boolean } {
  return note.reactions.heart;
}

export function toggleLike(like: { count: number; mine: boolean }): { count: number; mine: boolean } {
  return { count: Math.max(0, like.count + (like.mine ? -1 : 1)), mine: !like.mine };
}

export function withPendingNote(runs: NoteRow[], pending: NoteRow, parentId: number | null): NoteRow[] {
  if (parentId === null) return [...runs, pending];
  return runs.map((run) => (run.id === parentId ? { ...run, replies: [...run.replies, pending] } : run));
}

export function threadCount(runs: { replies: unknown[] }[]): number {
  return runs.reduce((sum, run) => sum + 1 + run.replies.length, 0);
}

export function repliesLabel(count: number, open: boolean): string {
  if (open) return "Hide replies";
  return `View ${count} ${count === 1 ? "reply" : "replies"}`;
}

export function emptyReactions(): Reactions {
  return Object.fromEntries(
    REACTION_KINDS.map((k) => [k, { count: 0, mine: false }]),
  ) as Reactions;
}

export function commentTime(at: Date, now = new Date()): string {
  const mins = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ago`;

  const time = at.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (mins < 48 * 60) return `Yesterday ${time}`;
  if (mins < 7 * 24 * 60)
    return `${at.toLocaleDateString("en-GB", { weekday: "short" })} ${time}`;
  return `${at.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${time}`;
}

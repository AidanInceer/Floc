/**
 * The client-safe half of discussion threads (v0.2 ticket 06): the shape of a
 * comment, and how its timestamp reads. `note-thread.tsx` is a Client
 * Component, so this file must never touch the database — the read lives in
 * `server/notes/notes-read.ts`.
 */

import type { AvatarIcon } from "../people/avatar-icon";
import { REACTION_KINDS, type ReactionKind } from "../vocabulary";

export type Reactions = Record<ReactionKind, { count: number; mine: boolean }>;

export type NoteRow = {
  id: number;
  body: string;
  createdAt: Date;
  /** Set once the author has rewritten it — rendered as "edited". */
  editedAt: Date | null;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  /** The author's trip avatar colour — see `TripMember.tone`. */
  authorTone?: string;
  reactions: Reactions;
  /** Replies to this comment. Always empty on a reply — one level only. */
  replies: NoteRow[];
};

/**
 * The one reaction a thread shows: a heart. The other kinds stay in the table and are
 * neither drawn nor counted (event comments D, 2026-11-07).
 */
export function likes(note: { reactions: Reactions }): { count: number; mine: boolean } {
  return note.reactions.heart;
}

/** Every comment in a thread, replies included. */
export function threadCount(runs: { replies: unknown[] }[]): number {
  return runs.reduce((sum, run) => sum + 1 + run.replies.length, 0);
}

/** The fold under a comment with replies. */
export function repliesLabel(count: number, open: boolean): string {
  if (open) return "Hide replies";
  return `View ${count} ${count === 1 ? "reply" : "replies"}`;
}

export function emptyReactions(): Reactions {
  return Object.fromEntries(
    REACTION_KINDS.map((k) => [k, { count: 0, mine: false }]),
  ) as Reactions;
}

/**
 * Relative under a day, then day-and-time (ticket 06 — the old day-granular
 * stamp read three same-day comments as identical "12 Sep"s). Rendered
 * server-side, accurate as of last revalidation, not to the second.
 */
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

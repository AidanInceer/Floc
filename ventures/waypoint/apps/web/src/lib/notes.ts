/**
 * The client-safe half of discussion threads (v0.2 ticket 06): the shape of a
 * comment, and how its timestamp reads. `note-thread.tsx` is a Client
 * Component, so this file must never touch `@/db` — the read lives in
 * `lib/notes-read.ts`, the same split as `lib/tabs.ts` vs `lib/unlocks.ts`.
 */
import { REACTION_KINDS, type ReactionKind } from "@/db/schema";

export type Reactions = Record<ReactionKind, { count: number; mine: boolean }>;

export type NoteRow = {
  id: number;
  body: string;
  createdAt: Date;
  /** Set once the author has rewritten it — rendered as "edited". */
  editedAt: Date | null;
  createdBy: string;
  authorName: string;
  authorAvatar: string | null;
  /** The author's trip avatar colour — see `TripMember.tone`. */
  authorTone?: string;
  reactions: Reactions;
  /** Replies to this comment. Always empty on a reply — one level only. */
  replies: NoteRow[];
};

export function emptyReactions(): Reactions {
  return Object.fromEntries(
    REACTION_KINDS.map((k) => [k, { count: 0, mine: false }]),
  ) as Reactions;
}

/**
 * Relative under a day, then day-and-time. The old stamp was day-granular, so
 * a thread that moved three times on Tuesday read as three identical "12 Sep"s
 * (ticket 06). Rendered on the server, so it is accurate as of the last
 * revalidation rather than to the second — which is the right precision for a
 * conversation between five friends.
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

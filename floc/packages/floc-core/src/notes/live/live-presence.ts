import type * as Y from "yjs";

import { whoTone } from "../../people/who";
import { liveBlockCursor, liveCursorBlockId } from "./live-block-cursor";

export type LiveUser = { id: string; name: string; tone: string; color: string };

export type PresentPerson = { id: string; name: string; tone: string };

export type PresentBlockCursor = PresentPerson & { blockId: string };

const FALLBACK_TONE = "who-8";

export function liveUser(person: { id: string; name: string }): LiveUser {
  // Why a fixed hex: y-prosemirror warns on anything but #rrggbb, and a real
  // colour cannot follow each viewer's theme. The tone class does the painting.
  return { id: person.id, name: person.name, tone: whoTone(person.name), color: "#000000" };
}

/** Another client's awareness is untrusted: its tone lands in a style attribute. */
export function cursorTone(user: object): string {
  const tone = (user as { tone?: unknown }).tone;
  return typeof tone === "string" && /^who-[1-8]$/.test(tone) ? tone : FALLBACK_TONE;
}

export function presentPeople(states: Map<number, unknown>): PresentPerson[] {
  const people = new Map<string, PresentPerson>();
  for (const state of states.values()) {
    const user = (state as { user?: Record<string, unknown> } | null)?.user;
    if (typeof user?.id !== "string" || typeof user.name !== "string") continue;
    if (!people.has(user.id)) people.set(user.id, { id: user.id, name: user.name, tone: cursorTone(user) });
  }
  return [...people.values()];
}

export function presentBlockCursors(states: Map<number, unknown>, doc: Y.Doc): PresentBlockCursor[] {
  const cursors = new Map<string, PresentBlockCursor>();
  for (const state of states.values()) {
    const remote = state as { user?: Record<string, unknown>; cursor?: unknown; blockCursor?: unknown } | null;
    const user = remote?.user;
    if (typeof user?.id !== "string" || typeof user.name !== "string" || cursors.has(user.id)) continue;
    const explicit = remote?.blockCursor;
    const blockId = typeof explicit === "string" && liveBlockCursor(doc, explicit)
      ? explicit
      : liveCursorBlockId(doc, remote?.cursor);
    if (blockId) cursors.set(user.id, { id: user.id, name: user.name, tone: cursorTone(user), blockId });
  }
  return [...cursors.values()];
}

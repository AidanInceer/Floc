/**
 * Comments on a notes page (#408): `note` rows of the "page" scope, pinned to
 * a text range by a mark in the page itself. Any member may post, reply and
 * resolve (rule 6); editing and deleting stay the author's, as everywhere.
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { note } from "@/db/schema";
import type { NoteRow } from "@floc/core/notes/notes";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { pagesChanged } from "@/server/notes/live/live-ping";
import { insertNote, resolveParent } from "@/server/notes/notes";
import { loadThreads } from "@/server/notes/notes-read";
import type { Refusal } from "./pages";
import { findPage } from "./pages-read";

export async function loadPageComments(args: {
  tripId: number;
  pageId: number;
  viewerId: string;
  toneOf: Map<string, string | undefined>;
}): Promise<NoteRow[]> {
  const threads = await loadThreads({ tripId: args.tripId, scope: "page", viewerId: args.viewerId, toneOf: args.toneOf });
  return threads.get(args.pageId) ?? [];
}

/** A new thread when `replyTo` is null, else a reply to it. Answers the new comment's id. */
export async function addPageComment(args: {
  tripId: number;
  pageId: number;
  userId: string;
  replyTo: number | null;
  body: string;
}): Promise<{ id: number } | Refusal> {
  const body = args.body.trim();
  if (!body) return { error: "Write something first." };
  const page = await findPage(args.tripId, args.pageId);
  if (!page || page.archivedAt) return { error: "That page has gone." };
  let parentId: number | null = null;
  if (args.replyTo !== null) {
    const parent = await resolveParent({ tripId: args.tripId, scope: "page", scopeId: args.pageId, replyTo: args.replyTo });
    if (parent === undefined) return { error: "That comment has gone." };
    parentId = parent;
  }
  const id = await insertNote({ tripId: args.tripId, createdBy: args.userId, scope: "page", scopeId: args.pageId, parentId, body });
  refresh({ kind: "thread", tripId: args.tripId, scope: "page" });
  pagesChanged(args.tripId);
  return { id };
}

export async function resolvePageComment(tripId: number, noteId: number): Promise<void> {
  await db.update(note).set({ resolvedAt: new Date(), ...touch() }).where(
    and(eq(note.id, noteId), eq(note.tripId, tripId), eq(note.scope, "page"), isNull(note.parentId), isNull(note.deletedAt)),
  );
  refresh({ kind: "thread", tripId, scope: "page" });
  pagesChanged(tripId);
}

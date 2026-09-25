/**
 * The notes-pages half of the port (#408): the page list, trip links and page
 * comments. The pages' words travel over the live socket, not here.
 */
import type { PageIcon } from "@floc/core/notes/pages/page-icons";
import type { TripLinkItem } from "@floc/core/notes/pages/trip-links";

import type { Comment } from "./port-comment";

export type NotesPage = { id: number; parentId: number | null; title: string; icon: PageIcon | null; depth: 0 | 1 };
export type ArchivedNotesPage = { id: number; parentId: number | null; title: string; icon: PageIcon | null; archivedAt: string };
export type NotesPages = { pages: NotesPage[]; archived: ArchivedNotesPage[] };

/** A refusal is the sentence the control shows; null means it landed. */
export type Refused = string | null;

export type PagesPort = {
  listPages(viewerId: string, tripId: number): Promise<NotesPages>;
  createPage(viewerId: string, tripId: number, parentId: number | null): Promise<{ id: number } | { error: string }>;
  renamePage(viewerId: string, tripId: number, pageId: number, title: string): Promise<Refused>;
  setPageIcon(viewerId: string, tripId: number, pageId: number, icon: PageIcon | null): Promise<void>;
  movePage(viewerId: string, tripId: number, pageId: number, beforeId: number | null): Promise<Refused>;
  archivePage(viewerId: string, tripId: number, pageId: number): Promise<Refused>;
  restorePage(viewerId: string, tripId: number, pageId: number): Promise<Refused>;
  listTripLinks(viewerId: string, tripId: number): Promise<TripLinkItem[]>;
  listPageComments(viewerId: string, tripId: number, pageId: number): Promise<Comment[]>;
  addPageComment(viewerId: string, tripId: number, pageId: number, replyTo: number | null, body: string): Promise<{ id: number } | { error: string }>;
  resolvePageComment(viewerId: string, tripId: number, commentId: number): Promise<void>;
};

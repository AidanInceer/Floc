/**
 * The port's notes-pages half (#408): the same `server/notes/pages` modules the
 * web's Server Actions call, so the phone and the browser change one list by
 * one set of rules. Every call resolves the trip first (rule 5).
 */
import "server-only";

import type { Comment, FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { toComment } from "@/server/api-port/api-port-comments";
import { addPageComment, loadPageComments, resolvePageComment } from "@/server/notes/pages/page-comments";
import { archivePage, createPage, movePage, renamePage, restorePage, setPageIcon } from "@/server/notes/pages/pages";
import { loadPages } from "@/server/notes/pages/pages-read";
import { loadTripLinkItems } from "@/server/notes/pages/trip-link-items";

type PagesPort = Pick<
  FlocPort,
  | "listPages"
  | "createPage"
  | "renamePage"
  | "setPageIcon"
  | "movePage"
  | "archivePage"
  | "restorePage"
  | "listTripLinks"
  | "listPageComments"
  | "addPageComment"
  | "resolvePageComment"
>;

const words = (refused: { error: string } | null) => refused?.error ?? null;

export const pagesPort: PagesPort = {
  async listPages(viewerId, tripId) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    const { pages, archived } = await loadPages(trip.id, viewer.id);
    return {
      pages: pages.map(({ id, parentId, title, icon, depth }) => ({ id, parentId, title, icon, depth })),
      archived: archived.map(({ id, parentId, title, icon, archivedAt }) => ({ id, parentId, title, icon, archivedAt: archivedAt.toISOString() })),
    };
  },
  async createPage(viewerId, tripId, parentId) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    return createPage(trip.id, viewer.id, parentId);
  },
  async renamePage(viewerId, tripId, pageId, title) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    return words(await renamePage(trip.id, pageId, viewer.id, title));
  },
  async setPageIcon(viewerId, tripId, pageId, icon) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    await setPageIcon(trip.id, pageId, viewer.id, icon);
  },
  async movePage(viewerId, tripId, pageId, beforeId) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    return words(await movePage(trip.id, pageId, viewer.id, beforeId));
  },
  async archivePage(viewerId, tripId, pageId) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    return words(await archivePage(trip.id, pageId, viewer.id));
  },
  async restorePage(viewerId, tripId, pageId) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    return words(await restorePage(trip.id, pageId, viewer.id));
  },
  async listTripLinks(viewerId, tripId) {
    const { trip } = await scoped(viewerId, tripId);
    return loadTripLinkItems(trip.id);
  },
  async listPageComments(viewerId, tripId, pageId): Promise<Comment[]> {
    const { trip, viewer } = await scoped(viewerId, tripId);
    // No tones: the phone already has the roster and colours its own faces.
    return (await loadPageComments({ tripId: trip.id, pageId, viewerId: viewer.id, toneOf: new Map() })).map(toComment);
  },
  async addPageComment(viewerId, tripId, pageId, replyTo, body) {
    const { trip, viewer } = await scoped(viewerId, tripId);
    return addPageComment({ tripId: trip.id, pageId, userId: viewer.id, replyTo, body });
  },
  async resolvePageComment(viewerId, tripId, commentId) {
    const { trip } = await scoped(viewerId, tripId);
    await resolvePageComment(trip.id, commentId);
  },
};

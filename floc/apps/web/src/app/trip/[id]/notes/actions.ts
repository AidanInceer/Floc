"use server";

// Notes pages (#408): every change any member may make (rule 6). Refusals come
// back as the sentence the control shows; the server modules own the rules and
// tell everyone's open Notes that something changed.
import { requireTripAccess } from "@/server/access";
import { addPageComment, resolvePageComment } from "@/server/notes/pages/page-comments";
import { archivePage, createPage, movePage, renamePage, restorePage, setPageIcon } from "@/server/notes/pages/pages";
import { readPageIcon } from "@floc/core/notes/pages/page-icons";
import { asText } from "@floc/core/text/text";

const words = (refused: { error: string } | null) => refused?.error ?? null;

export async function newPage(tripId: number, parentId: number | null) {
  const { trip, viewer } = await requireTripAccess(tripId);
  return createPage(trip.id, viewer.id, parentId);
}

export async function renamePageAction(tripId: number, pageId: number, title: string) {
  const { trip, viewer } = await requireTripAccess(tripId);
  return words(await renamePage(trip.id, pageId, viewer.id, asText(title)));
}

export async function setPageIconAction(tripId: number, pageId: number, icon: string | null) {
  const { trip, viewer } = await requireTripAccess(tripId);
  await setPageIcon(trip.id, pageId, viewer.id, readPageIcon(icon));
}

export async function movePageAction(tripId: number, pageId: number, beforeId: number | null) {
  const { trip, viewer } = await requireTripAccess(tripId);
  return words(await movePage(trip.id, pageId, viewer.id, beforeId));
}

export async function archivePageAction(tripId: number, pageId: number) {
  const { trip, viewer } = await requireTripAccess(tripId);
  return words(await archivePage(trip.id, pageId, viewer.id));
}

export async function restorePageAction(tripId: number, pageId: number) {
  const { trip, viewer } = await requireTripAccess(tripId);
  return words(await restorePage(trip.id, pageId, viewer.id));
}

export async function startPageThread(tripId: number, pageId: number, body: string) {
  const { trip, viewer } = await requireTripAccess(tripId);
  const made = await addPageComment({ tripId: trip.id, pageId, userId: viewer.id, replyTo: null, body: asText(body) });
  return "error" in made ? made : made.id;
}

export async function replyPageThread(tripId: number, pageId: number, threadId: number, body: string) {
  const { trip, viewer } = await requireTripAccess(tripId);
  const made = await addPageComment({ tripId: trip.id, pageId, userId: viewer.id, replyTo: threadId, body: asText(body) });
  return "error" in made ? made.error : null;
}

export async function resolvePageThread(tripId: number, threadId: number) {
  const { trip } = await requireTripAccess(tripId);
  await resolvePageComment(trip.id, threadId);
}

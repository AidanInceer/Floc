/** Notes tab (#238, #408): the trip's pages, one open at a time, written by everyone at once. */
import type { PageThread } from "@floc/editor/view/comments";
import { commentTime, type NoteRow } from "@floc/core/notes/notes";
import { whoTone } from "@floc/core/people/who";

import { NotesWorkspace } from "@/components/notes/pages/notes-workspace";
import { requireTripAccess } from "@/server/access";
import { loadPageEpoch } from "@/server/notes/live/live-epoch-store";
import { loadPageComments } from "@/server/notes/pages/page-comments";
import { loadPages } from "@/server/notes/pages/pages-read";
import { loadTripLinkItems } from "@/server/notes/pages/trip-link-items";

export const metadata = { title: "Notes" };

function toThread(row: NoteRow, now: Date): PageThread {
  const post = (note: NoteRow) => ({ id: note.id, name: note.authorName, tone: note.authorTone ?? whoTone(note.authorName), body: note.body, when: commentTime(note.createdAt, now) });
  return { id: row.id, posts: [post(row), ...row.replies.map(post)] };
}

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const access = await requireTripAccess(id, `/trip/${id}/notes`);
  const { trip, viewer } = access;
  const [{ pages, archived }, links] = await Promise.all([loadPages(trip.id, viewer.id), loadTripLinkItems(trip.id)]);
  const open = pages.find((p) => p.id === Number(page)) ?? pages[0];
  const toneOf = new Map(access.members.map((member) => [member.userId, member.tone]));
  const [rows, epoch] = await Promise.all([
    loadPageComments({ tripId: trip.id, pageId: open.id, viewerId: viewer.id, toneOf }),
    loadPageEpoch(open.id),
  ]);
  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <NotesWorkspace
        tripId={trip.id}
        pages={pages.map(({ id: pageId, parentId, title, icon, depth }) => ({ id: pageId, parentId, title, icon, depth }))}
        archived={archived.map(({ id: pageId, title, icon, archivedAt }) => ({ id: pageId, title, icon, archivedAt: archivedAt.toISOString() }))}
        openId={open.id}
        epoch={epoch}
        viewer={{ id: viewer.id, name: viewer.name }}
        links={links}
        threads={rows.map((row) => toThread(row, now))}
        now={now.toISOString()}
      />
    </div>
  );
}

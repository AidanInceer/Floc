/**
 * Notes tab (ticket 238) — the trip's free-form document. The idea board that
 * used to be this whole page is now one block inside it (tickets 14, 196).
 */
import { requireTripAccess } from "@/server/access";
import { listIdeas, listVotes } from "@/server/ideas";
import { loadNoteDoc } from "@/server/note-doc";
import { loadThreads } from "@/server/notes-read";
import type { IdeaCardData } from "@/components/idea-data";
import { NotesDoc } from "@/components/notes-doc";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/notes`);
  const { trip, viewer, members, isAdmin } = access;
  const tripId = trip.id;

  // One person, one avatar colour across every tab.
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

  const [doc, ideaRows, voteRows, notesByIdea] = await Promise.all([
    loadNoteDoc(tripId),
    listIdeas(tripId),
    listVotes(tripId),
    loadThreads({ tripId, scope: "idea", viewerId: viewer.id, toneOf }),
  ]);

  const votesByIdea = new Map<number, IdeaCardData["votes"]>();
  for (const v of voteRows) {
    const list = votesByIdea.get(v.ideaId) ?? [];
    list.push({
      userId: v.userId,
      name: v.name,
      avatarUrl: v.avatarUrl,
      value: v.value,
      tone: toneOf.get(v.userId),
    });
    votesByIdea.set(v.ideaId, list);
  }

  const ideas: IdeaCardData[] = ideaRows.map((r) => ({
    id: r.id,
    note: r.note,
    createdBy: r.createdBy,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar,
    authorTone: toneOf.get(r.createdBy),
    createdAt: r.createdAt,
    pinnedAt: r.pinnedAt,
    votes: votesByIdea.get(r.id) ?? [],
    notes: notesByIdea.get(r.id) ?? [],
  }));

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <div className="rounded-2xl border border-rule bg-sheet px-2 py-8 sm:px-4 sm:py-10">
        {/* The 48px gutter is the editor's: its add and drag handles sit in it,
            one block to the left of the text. The heading takes the same indent
            so the two line up. */}
        <div className="pl-12 pr-4 sm:pr-8">
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Notes</h1>
        </div>
        <div className="mt-6 pl-12 pr-4 sm:pr-8">
          <NotesDoc
            tripId={tripId}
            initialDoc={doc}
            board={{ ideas, tripId, viewerId: viewer.id, isAdmin }}
          />
        </div>
      </div>
    </div>
  );
}

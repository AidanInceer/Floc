/** Notes tab (ticket 238) — the trip's free-form document. */
import { requireTripAccess } from "@/server/access";
import { loadLiveEpoch } from "@/server/notes/live/live-epoch-store";
import { NotesDoc } from "@/components/notes/notes-doc";
import { PageTitle } from "@/components/system/ui";

export const metadata = { title: "Notes" };

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { trip, viewer } = await requireTripAccess(id, `/trip/${id}/notes`);
  const epoch = await loadLiveEpoch(trip.id);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <div className="rounded-2xl border border-rule bg-sheet px-2 py-8 sm:px-4 sm:py-10">
        {/* The 48px gutter is the editor's: its add and drag handles sit in it,
            one block to the left of the text. The heading takes the same indent
            so the two line up. */}
        <div className="pl-12 pr-4 sm:pr-8">
          <PageTitle>Notes</PageTitle>
        </div>
        <div className="mt-6 pl-12 pr-4 sm:pr-8">
          <NotesDoc tripId={trip.id} epoch={epoch} viewer={{ id: viewer.id, name: viewer.name }} />
        </div>
      </div>
    </div>
  );
}

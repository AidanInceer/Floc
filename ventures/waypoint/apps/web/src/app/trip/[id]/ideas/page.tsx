/**
 * Ideas tab (ticket 14): the idea board and its voting. Always open — as,
 * since ticket 126, every other tab is too.
 *
 * Availability used to live at the bottom of this page; it has its own Dates
 * tab now, because deciding *when* deserves a calendar rather than a table
 * bolted to the end of the idea board.
 */
import Link from "next/link";

import { voteScore } from "@/lib/votes";
import { listIdeas, listVotes } from "@/server/ideas";
import { requireTripAccess } from "@/server/access";
import { loadThreads } from "@/server/notes-read";
import { getProfile } from "@/server/profile";
import { readVibeTags } from "@/lib/vibe-tags";
import { EmptyState, Page, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { IdeaCard, type IdeaCardData } from "@/components/idea-card";
import { postIdea } from "./actions";

type SortMode = "new" | "liked";

export default async function IdeasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const { sort } = await searchParams;
  const access = await requireTripAccess(id, `/trip/${id}/ideas`);
  const { trip, viewer, members, isAdmin } = access;
  const tripId = trip.id;
  const sortMode: SortMode = sort === "liked" ? "liked" : "new";

  // Authors and voters get the avatar colour they already have in this trip's
  // roster, so one person is one colour across every tab (see `whoTone`).
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

  /*
   * Every read this page needs, in one round trip. None of them depends on
   * another: each aggregate read scopes itself by `trip_id` rather than by a
   * list of ids another read has to return first (ticket 118 kept the fan-out
   * here on the page for exactly that reason — see `server/ideas.ts`).
   */
  const [ideaRows, viewerProfile, voteRows, notesByIdea] = await Promise.all([
    listIdeas(tripId),
    getProfile(viewer.id),
    listVotes(tripId),
    // Replies and reactions made the thread read too complicated to
    // assemble twice — Days runs the same helper (v0.2 ticket 06).
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

  let ideas: IdeaCardData[] = ideaRows.map((r) => ({
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

  // "Most liked" is opt-in via ?sort=liked. Newest-first stays the default
  // because voting is optional (ticket 01 step 5) — a tally-first order
  // would rank an unvoted-but-good idea below a stale one three people
  // happened to tap, which reads as the group having judged it when really
  // nobody's looked yet.
  if (sortMode === "liked") {
    // Three tiers, weighted in `voteScore` — a thumbs-up is a quiet yes and has
    // to count for something, which it didn't when this was keen-minus-rather-not
    // and a don't-mind was thrown away.
    ideas = [...ideas].sort((a, b) => voteScore(b.votes) - voteScore(a.votes));
  }

  // Pinning is the one thing that overrides the sort (ticket 09): pinned notes
  // lead the board, oldest pin first, and the rest keep whatever order the sort
  // chose. They sit in the same wrapping flow as everything else rather than in
  // a row of their own — the filled pin on the note is what marks them.
  const pinned = ideas
    .filter((i) => i.pinnedAt !== null)
    .sort((a, b) => a.pinnedAt!.getTime() - b.pinnedAt!.getTime());
  const unpinned = ideas.filter((i) => i.pinnedAt === null);

  const vibes = readVibeTags(viewerProfile?.vibeTags);

  return (
    <Page wide flush>
      <PageHeader
        title="Ideas"
        subtitle="Anyone can suggest, voting is optional — posting the first idea opens Route for everyone."
        actions={
          <div className="flex gap-2">
            <SortLink tripId={tripId} sort="new" active={sortMode === "new"}>
              Newest
            </SortLink>
            {/* "Most liked" since ticket 36: the vote is a heart, a thumbs-up
                and a thumbs-down now, so the board's sort says the same word
                the comment threads' own sort does. All three tiers count —
                see `voteScore`. */}
            <SortLink tripId={tripId} sort="liked" active={sortMode === "liked"}>
              Most liked
            </SortLink>
          </div>
        }
      />

      {/*
        One board, laid out in reading order: a wrapping row of fixed-width
        tiles that fills left-to-right, then wraps to the next row — including
        back under the composer, which is just the first tile.

        This replaced a CSS-multicol masonry. Multicol fills *column*-major, so
        with the composer parked in its own left-hand column the space beneath
        it stayed permanently empty and the notes read top-to-bottom rather than
        across. Ragged column packing was the thing multicol was chosen for, but
        reading order matters more on a board people scan.

        Pinned notes are simply first in the sequence rather than living in a
        separate row above — a row of their own broke the flow and pushed the
        composer off the top-left corner.
      */}
      <ul className="flex flex-wrap items-start gap-5">
        <li className="w-full rounded-sm border border-dashed border-rule-strong bg-sheet-2 p-4 sm:w-56">
          <form
            action={postIdea.bind(null, tripId)}
            className="flex flex-col gap-2"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.07em] text-ink-faint">
              Post an idea
            </span>
            <textarea
              name="note"
              required
              rows={4}
              maxLength={2000}
              placeholder={
                vibes.length
                  ? `"${vibes[0]}" somewhere with good trains…`
                  : "A place, a vibe, a whole trip shape…"
              }
              className="resize-none border-none bg-transparent p-0 font-hand text-base text-ink-soft placeholder:text-ink-faint focus:outline-none"
            />
            <div>
              <SubmitButton pendingLabel="Pinning…">Pin it to the board</SubmitButton>
            </div>
          </form>
        </li>

        {[...pinned, ...unpinned].map((i) => (
          <IdeaCard
            key={i.id}
            tripId={tripId}
            idea={i}
            viewerId={viewer.id}
            isAdmin={isAdmin}
            className="w-full sm:w-56"
          />
        ))}
      </ul>

      {ideas.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing on the board yet"
            action={vibes.length === 0 ? (
              <Link
                href="/profile"
                className="text-sm font-medium text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep"
              >
                Pick your vibe tags
              </Link>
            ) : undefined}
          >
            {vibes.length > 0
              ? `Something like "${vibes[0]} weekend somewhere new", going by what you like.`
              : "A place, a vibe, or a whole itinerary — nothing pinned here is binding."}
          </EmptyState>
        </div>
      ) : null}
    </Page>
  );
}

function SortLink({
  tripId,
  sort,
  active,
  children,
}: {
  tripId: number;
  sort: SortMode;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`/trip/${tripId}/ideas${sort === "new" ? "" : `?sort=${sort}`}`}
      className={
        active
          ? "rounded-sm border border-rule-strong bg-pen px-3 py-1.5 text-sm font-medium text-paper"
          : "rounded-sm border border-rule-strong bg-sheet px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-sheet-2"
      }
    >
      {children}
    </a>
  );
}

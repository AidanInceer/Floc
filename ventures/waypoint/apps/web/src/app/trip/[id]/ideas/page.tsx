/**
 * Ideas tab (ticket 14; redesigned 196) — the board of places the group might
 * go. Ideas the viewer hasn't voted on lead the board and are the only blue
 * thing on it; everything already voted on falls in behind, whatever the sort.
 */
import Link from "next/link";

import { voteScore } from "@/lib/votes";
import { listIdeas, listVotes } from "@/server/ideas";
import { requireTripAccess } from "@/server/access";
import { loadThreads } from "@/server/notes-read";
import { getProfile } from "@/server/profile";
import { readVibeTags } from "@/lib/vibe-tags";
import { ButtonLink } from "@/components/ui";
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

  // One person, one avatar colour across every tab.
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

  const [ideaRows, viewerProfile, voteRows, notesByIdea] = await Promise.all([
    listIdeas(tripId),
    getProfile(viewer.id),
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

  // Newest-first default: voting is optional (ticket 01 step 5), so a
  // tally-first order would rank an unvoted good idea below a stale one.
  if (sortMode === "liked") {
    ideas = [...ideas].sort((a, b) => voteScore(b.votes) - voteScore(a.votes));
  }

  // Pinning overrides sort (ticket 09): pinned lead, oldest first.
  const inOrder = [
    ...ideas
      .filter((i) => i.pinnedAt !== null)
      .sort((a, b) => a.pinnedAt!.getTime() - b.pinnedAt!.getTime()),
    ...ideas.filter((i) => i.pinnedAt === null),
  ];

  // The one split the sort never touches: an unvoted idea is the viewer's turn.
  const votedBy = (i: IdeaCardData) => i.votes.some((v) => v.userId === viewer.id);
  const yours = inOrder.filter((i) => !votedBy(i));
  const rest = inOrder.filter(votedBy);

  const vibes = readVibeTags(viewerProfile?.vibeTags);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Ideas</h1>
          <p className="mt-3 max-w-[64ch] text-md text-ink-soft">
            Anywhere the group might go. Anyone can suggest, and nothing pinned
            here is binding.
          </p>
        </div>
        {ideas.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="typed mr-1">Sort</span>
            <ButtonLink
              href={`/trip/${tripId}/ideas`}
              variant={sortMode === "new" ? "primary" : "secondary"}
              aria-current={sortMode === "new" ? "true" : undefined}
            >
              Newest
            </ButtonLink>
            <ButtonLink
              href={`/trip/${tripId}/ideas?sort=liked`}
              variant={sortMode === "liked" ? "primary" : "secondary"}
              aria-current={sortMode === "liked" ? "true" : undefined}
            >
              Most liked
            </ButtonLink>
          </div>
        ) : null}
      </header>

      <section className="mt-8 rounded-lg bg-butter p-6 text-butter-ink">
        <form
          action={postIdea.bind(null, tripId)}
          className="flex flex-wrap items-end gap-4"
        >
          <label className="min-w-[18rem] flex-1">
            <span className="typed text-current">Post an idea</span>
            <textarea
              name="note"
              required
              rows={2}
              maxLength={2000}
              placeholder={
                vibes.length
                  ? `"${vibes[0]}" somewhere with good trains…`
                  : "A place, a vibe, a whole trip shape…"
              }
              className="mt-2 w-full resize-none rounded-md border border-rule bg-sheet px-4 py-3 text-base placeholder:text-ink-faint focus-visible:border-pen"
            />
          </label>
          <SubmitButton pendingLabel="Pinning…">Pin it to the board</SubmitButton>
        </form>
      </section>

      {ideas.length === 0 ? (
        <div className="mt-4 rounded-lg bg-sheet px-6 py-14 text-center">
          <h2 className="text-xl">Nothing on the board yet</h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-soft">
            {vibes.length > 0
              ? `Something like "${vibes[0]} weekend somewhere new", going by what you like.`
              : "A place, a vibe, or a whole itinerary — the first one is what gets a trip moving."}
          </p>
          {vibes.length === 0 ? (
            <p className="mt-4">
              <Link
                href="/profile"
                className="text-sm font-medium text-pen underline underline-offset-2 hover:text-pen-deep"
              >
                Pick your vibe tags
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {yours.length > 0 ? (
        <>
          <SectionLabel
            left="Your turn"
            right={
              yours.length === 1
                ? "One idea you haven’t voted on"
                : `${yours.length} ideas you haven’t voted on`
            }
          />
          <Board
            ideas={yours}
            tripId={tripId}
            viewerId={viewer.id}
            isAdmin={isAdmin}
          />
        </>
      ) : null}

      {rest.length > 0 ? (
        <>
          <SectionLabel
            left={yours.length > 0 ? "Already voted" : "The board"}
            right={yours.length > 0 ? undefined : "You’ve voted on all of them"}
          />
          <Board
            ideas={rest}
            tripId={tripId}
            viewerId={viewer.id}
            isAdmin={isAdmin}
          />
        </>
      ) : null}
    </div>
  );
}

function Board({
  ideas,
  tripId,
  viewerId,
  isAdmin,
}: {
  ideas: IdeaCardData[];
  tripId: number;
  viewerId: string;
  isAdmin: boolean;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ideas.map((i) => (
        <IdeaCard
          key={i.id}
          tripId={tripId}
          idea={i}
          viewerId={viewerId}
          isAdmin={isAdmin}
        />
      ))}
    </ul>
  );
}

function SectionLabel({ left, right }: { left: string; right?: string }) {
  return (
    <div className="mb-4 mt-10 flex flex-wrap items-baseline justify-between gap-4">
      <span className="typed">{left}</span>
      {right ? <span className="typed">{right}</span> : null}
    </div>
  );
}

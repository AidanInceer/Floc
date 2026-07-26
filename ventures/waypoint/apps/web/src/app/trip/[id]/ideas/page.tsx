/**
 * Ideas tab (ticket 14): the idea board and its voting. Ideas is never locked —
 * unlike Route/Days, it's always open, and posting here is what unlocks
 * Route (src/lib/unlocks.ts).
 *
 * Availability used to live at the bottom of this page; it has its own Dates
 * tab now, because deciding *when* deserves a calendar rather than a table
 * bolted to the end of the idea board.
 */
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { idea, ideaVote, note, user, userProfile } from "@/db/schema";
import type { VoteValue } from "@/db/schema";
import { db } from "@/db";
import { requireTripAccess } from "@/lib/access";
import { getProfile } from "@/lib/profile";
import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
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

  // The ideas and the viewer's own profile are independent reads — issued
  // together rather than one after another.
  const [ideaRows, viewerProfile] = await Promise.all([
    db
      .select({
        id: idea.id,
        note: idea.note,
        createdAt: idea.createdAt,
        createdBy: idea.createdBy,
        authorName: user.name,
        authorAvatar: userProfile.avatarUrl,
      })
      .from(idea)
      .innerJoin(user, eq(user.id, idea.createdBy))
      .leftJoin(userProfile, eq(userProfile.userId, idea.createdBy))
      .where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)))
      .orderBy(desc(idea.createdAt))
      .all(),
    getProfile(viewer.id),
  ]);

  const ideaIds = ideaRows.map((r) => r.id);
  // Votes and note threads both hang off the same idea ids, so they go out
  // together and both stay scoped by `inArray` — an unscoped read here would
  // pull every vote and every note in the database.
  const [voteRows, noteRows] = ideaIds.length
    ? await Promise.all([
        db
          .select({
            ideaId: ideaVote.ideaId,
            userId: ideaVote.userId,
            value: ideaVote.value,
            name: user.name,
            avatarUrl: userProfile.avatarUrl,
          })
          .from(ideaVote)
          .innerJoin(user, eq(user.id, ideaVote.userId))
          .leftJoin(userProfile, eq(userProfile.userId, ideaVote.userId))
          .where(and(inArray(ideaVote.ideaId, ideaIds), isNull(ideaVote.deletedAt)))
          .all(),
        db
          .select({
            id: note.id,
            scopeId: note.scopeId,
            body: note.body,
            createdAt: note.createdAt,
            createdBy: note.createdBy,
            authorName: user.name,
            authorAvatar: userProfile.avatarUrl,
          })
          .from(note)
          .innerJoin(user, eq(user.id, note.createdBy))
          .leftJoin(userProfile, eq(userProfile.userId, note.createdBy))
          .where(
            and(
              eq(note.tripId, tripId),
              eq(note.scope, "idea"),
              inArray(note.scopeId, ideaIds),
              isNull(note.deletedAt),
            ),
          )
          .orderBy(asc(note.createdAt))
          .all(),
      ])
    : [[], []];

  // Authors and voters get the avatar colour they already have in this trip's
  // roster, so one person is one colour across every tab (see `whoTone`).
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

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

  const notesByIdea = new Map<number, IdeaCardData["notes"]>();
  for (const n of noteRows) {
    if (n.scopeId === null) continue;
    const list = notesByIdea.get(n.scopeId) ?? [];
    list.push({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
      authorName: n.authorName,
      authorAvatar: n.authorAvatar,
      authorTone: toneOf.get(n.createdBy),
    });
    notesByIdea.set(n.scopeId, list);
  }

  let ideas: IdeaCardData[] = ideaRows.map((r) => ({
    id: r.id,
    note: r.note,
    createdBy: r.createdBy,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar,
    authorTone: toneOf.get(r.createdBy),
    createdAt: r.createdAt,
    votes: votesByIdea.get(r.id) ?? [],
    notes: notesByIdea.get(r.id) ?? [],
  }));

  // "Most liked" is opt-in via ?sort=liked. Newest-first stays the default
  // because voting is optional (ticket 01 step 5) — a tally-first order
  // would rank an unvoted-but-good idea below a stale one three people
  // happened to tap, which reads as the group having judged it when really
  // nobody's looked yet.
  if (sortMode === "liked") {
    ideas = [...ideas].sort((a, b) => {
      const score = (i: IdeaCardData) =>
        i.votes.filter((v) => v.value === "up").length -
        i.votes.filter((v) => v.value === "down").length;
      return score(b) - score(a);
    });
  }

  const vibes = viewerProfile?.vibePreferences ?? [];

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
            <SortLink tripId={tripId} sort="liked" active={sortMode === "liked"}>
              Most liked
            </SortLink>
          </div>
        }
      />

      <Stack gap={6}>
        <Card>
          <CardHeader title="Post an idea" />
          <form
            action={async (formData) => {
              "use server";
              await postIdea(tripId, formData);
            }}
            className="flex flex-col gap-3 p-4"
          >
            <Field label="What's the idea?" hint="Free text — a place, a route, a whole trip shape.">
              <textarea
                name="note"
                required
                maxLength={2000}
                placeholder={
                  vibes.length
                    ? `e.g. "${vibes[0]}" somewhere with good trains`
                    : "e.g. A week doing not much on a beach"
                }
                className="min-h-20 w-full rounded-sm border border-rule-strong bg-sheet px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint"
              />
            </Field>
            <div>
              <SubmitButton pendingLabel="Posting…">Post idea</SubmitButton>
            </div>
          </form>
        </Card>

        {ideas.length === 0 ? (
          <EmptyState
            title="No ideas yet"
            action={vibes.length === 0 ? (
              <a
                href="/profile"
                className="text-sm font-medium text-pen underline underline-offset-2"
              >
                Set your vibe preferences
              </a>
            ) : undefined}
          >
            {vibes.length > 0
              ? `Based on what you like (${vibes.slice(0, 2).join(", ")}), maybe throw in something like "${vibes[0]} weekend somewhere new" — anything works, this is just a starting nudge.`
              : "Nobody's suggested anything yet. Post whatever's in your head — a place, a vibe, a whole itinerary. Setting your vibe preferences on your profile gives you starting prompts here."}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {ideas.map((i) => (
              <IdeaCard
                key={i.id}
                tripId={tripId}
                idea={i}
                viewerId={viewer.id}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </Stack>
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

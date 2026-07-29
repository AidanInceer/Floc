/**
 * /trips — post-login home (ticket 05). Lists every non-archived trip the
 * viewer is a member of.
 *
 * Sort (ticket 17): upcoming/undated trips first, ascending by start date
 * (undated trips sort after dated ones within that group — there's nothing
 * to put them ahead of); ended trips after, most-recently-ended first, since
 * a trip that just finished is more likely to still need a settle-up than
 * one from months ago.
 */
import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { idea, trip, tripMembership } from "@/db/schema";
import { listMembersFor, requireUser } from "@/lib/access";
import { hasEnded } from "@/lib/dates";
import { ButtonLink, EmptyState, Field, Input, Page, PageHeader, Stack } from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { TripCard } from "@/components/trip-card";
import type { TripCardData } from "@/components/trip-card";
import { createTrip } from "./actions";

export default async function TripsPage() {
  const viewer = await requireUser("/trips");

  const rows = await db
    .select({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      role: tripMembership.role,
    })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, viewer.id),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        isNull(trip.archivedAt),
      ),
    )
    .all();

  const tripIds = rows.map((r) => r.id);

  // The "needs you" hint and the rosters both depend on `tripIds` and on
  // nothing else, so they go out together rather than one after the other.
  //  - The idea probe is the cheapest signal a fresh trip has: an empty board
  //    is the one thing every one of them shares (ticket 17 asks for "cheap",
  //    not "complete").
  //  - One roster query covers every card, not one per card.
  const [ideaRows, membersByTrip] = await Promise.all([
    tripIds.length
      ? db
          .select({ tripId: idea.tripId })
          .from(idea)
          .where(and(inArray(idea.tripId, tripIds), isNull(idea.deletedAt)))
          .all()
      : [],
    listMembersFor(tripIds),
  ]);
  const tripsWithIdeas = new Set(ideaRows.map((r) => r.tripId));

  const cards: TripCardData[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    startDate: r.startDate,
    endDate: r.endDate,
    role: r.role,
    members: membersByTrip.get(r.id) ?? [],
    needsYou: !hasEnded(r.endDate) && !tripsWithIdeas.has(r.id),
  }));

  const ended = cards.filter((c) => hasEnded(c.endDate));
  const upcoming = cards.filter((c) => !hasEnded(c.endDate));

  upcoming.sort((a, b) => {
    if (a.startDate && b.startDate) return a.startDate < b.startDate ? -1 : 1;
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return 0;
  });
  ended.sort((a, b) => {
    if (a.endDate && b.endDate) return a.endDate > b.endDate ? -1 : 1;
    return 0;
  });

  const sorted = [...upcoming, ...ended];

  return (
    <Page>
      <PageHeader
        title="My trips"
        subtitle="Every trip you're part of, in one place."
        actions={
          <>
            <ButtonLink href="/trips/archived" variant="ghost">
              Archived
            </ButtonLink>
            {/*
             * Modal, not a full page (ticket 17): creating a trip is just a
             * name (ticket 01 step 1) — a full page would overstate the
             * ceremony for something this small.
             */}
            <Sheet trigger="New trip" title="Start a trip">
              <CreateTripForm />
            </Sheet>
          </>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          title="No trips yet"
          action={
            <Sheet trigger="Start your first trip" title="Start a trip">
              <CreateTripForm />
            </Sheet>
          }
        >
          Start one with just a name — you can decide dates and destinations
          with the group once it exists.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((t) => (
            <TripCard key={t.id} trip={t} href={`/trip/${t.id}/overview`} />
          ))}
        </ul>
      )}
    </Page>
  );
}

/**
 * Plain server-rendered form. `createTrip` redirects on success, which
 * navigates the whole page and takes the dialog with it — no client-side
 * close handler needed (and none is possible: a function prop can't cross
 * the server/client boundary from here, only the "use server" action can).
 */
function CreateTripForm() {
  return (
    <form action={createTrip}>
      <Stack gap={4}>
        <Field label="Name">
          <Input name="name" required placeholder="Milan long weekend" />
        </Field>
        {/* Genuinely optional, and usually left blank: the Dates tab is where
            the group works out when it can actually go. Only fill these in if
            the dates are already a fact. */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" hint="Optional">
            <Input type="date" name="startDate" />
          </Field>
          <Field label="End date" hint="Optional">
            <Input type="date" name="endDate" />
          </Field>
        </div>
        <p className="text-xs text-ink-faint">
          No idea when yet? Leave the dates blank — everyone can mark what
          they&rsquo;re free for on the trip&rsquo;s Dates tab and you can pick
          from the overlap.
        </p>
        <SubmitButton pendingLabel="Creating…">Create trip</SubmitButton>
      </Stack>
    </form>
  );
}

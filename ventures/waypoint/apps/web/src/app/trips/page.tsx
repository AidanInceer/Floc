/**
 * /trips — post-login home (ticket 05). Lists every non-archived trip the
 * viewer is a member of.
 *
 * Default sort (ticket 17): upcoming/undated trips first, ascending by start
 * date (undated trips sort after dated ones within that group — there's
 * nothing to put them ahead of); ended trips after, most-recently-ended
 * first, since a trip that just finished is more likely to still need a
 * settle-up than one from months ago.
 *
 * The chosen sort (ticket 70) is held in the URL, not in state and not in a
 * column. Three reasons: the page stays a server component with no client JS,
 * a chosen view is linkable, and a *persisted* preference would be a per-user
 * setting on a page most people open with one thing in mind — "where's the
 * Lisbon one" is a search, not a preference. Reload returns to the default
 * deliberately.
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, idea, place, trip, tripMembership } from "@/db/schema";
import { listMembersFor, requireUser } from "@/lib/access";
import { hasEnded } from "@/lib/dates";
import {
  ButtonLink,
  EmptyState,
  Field,
  Input,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { TripCard } from "@/components/trip-card";
import type { TripCardData } from "@/components/trip-card";
import { createTrip } from "./actions";

/** The orders offered, in the order the control offers them. */
const SORTS = {
  date: "Date",
  place: "Place",
  name: "Name",
} as const;
type Sort = keyof typeof SORTS;

function readSort(value: string | string[] | undefined): Sort {
  return typeof value === "string" && value in SORTS ? (value as Sort) : "date";
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = readSort(params.sort);

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
  const [ideaRows, membersByTrip, placeRows] = await Promise.all([
    tripIds.length
      ? db
          .select({ tripId: idea.tripId })
          .from(idea)
          .where(and(inArray(idea.tripId, tripIds), isNull(idea.deletedAt)))
          .all()
      : [],
    listMembersFor(tripIds),
    // Where a trip *is*, for the Place sort (ticket 70). A trip has no
    // destination column — rule 3 keeps the itinerary day-first — so this is
    // derived the same way Route derives its stops: the earliest day with an
    // overnight place. Ordered by date here so the first row per trip wins.
    tripIds.length
      ? db
          .select({ tripId: day.tripId, date: day.date, placeName: place.name })
          .from(day)
          .innerJoin(place, eq(place.id, day.overnightPlaceId))
          .where(
            and(
              inArray(day.tripId, tripIds),
              isNull(day.deletedAt),
              isNull(place.deletedAt),
            ),
          )
          .orderBy(asc(day.date))
          .all()
      : [],
  ]);
  const tripsWithIdeas = new Set(ideaRows.map((r) => r.tripId));

  const whereByTrip = new Map<number, string>();
  for (const r of placeRows) {
    if (!whereByTrip.has(r.tripId)) whereByTrip.set(r.tripId, r.placeName);
  }

  const cards: TripCardData[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    startDate: r.startDate,
    endDate: r.endDate,
    role: r.role,
    members: membersByTrip.get(r.id) ?? [],
    needsYou: !hasEnded(r.endDate) && !tripsWithIdeas.has(r.id),
    where: whereByTrip.get(r.id) ?? null,
  }));

  const sorted = sortCards(cards, sort);

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

      {/* Only worth showing once there is more than one trip to order. */}
      {cards.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
            Sort
          </span>
          {(Object.keys(SORTS) as Sort[]).map((key) => (
            <ButtonLink
              key={key}
              href={hrefFor({ sort: key })}
              variant={key === sort ? "primary" : "secondary"}
              aria-current={key === sort ? "true" : undefined}
            >
              {SORTS[key]}
            </ButtonLink>
          ))}
        </div>
      ) : null}

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

/** The view as a URL — the default sort is the bare path. */
function hrefFor({ sort }: { sort: Sort }) {
  return sort === "date" ? "/trips" : `/trips?sort=${sort}`;
}

/**
 * The three orders (ticket 70).
 *
 * `date` is ticket 17's original and stays the default — it is the only one
 * that splits the list in two, because "when" is the question a trip list is
 * usually being asked. `place` and `name` are flat A–Z: once you're looking
 * for the Lisbon one, whether it has ended is beside the point. A trip with
 * nowhere settled yet sorts last under `place` rather than first, so the
 * blanks don't hold the top of the list.
 */
function sortCards(cards: TripCardData[], sort: Sort): TripCardData[] {
  const byName = (a: TripCardData, b: TripCardData) =>
    a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" });

  if (sort === "name") return [...cards].sort(byName);

  if (sort === "place") {
    return [...cards].sort((a, b) => {
      if (a.where && b.where) {
        const byPlace = a.where.localeCompare(b.where, "en-GB", { sensitivity: "base" });
        return byPlace !== 0 ? byPlace : byName(a, b);
      }
      if (a.where) return -1;
      if (b.where) return 1;
      return byName(a, b);
    });
  }

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

  return [...upcoming, ...ended];
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

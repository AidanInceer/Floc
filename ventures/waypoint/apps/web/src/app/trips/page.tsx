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
 * Sorting and tag filtering (tickets 70, 71) are held in the URL, not in
 * state and not in a column. Three reasons: the page stays a server component
 * with no client JS, a chosen view is linkable, and a *persisted* preference
 * would be a per-user setting on a page most people open with one thing in
 * mind — "where's the Lisbon one" is a search, not a preference. Reload
 * returns to the default deliberately.
 */
import { requireUser } from "@/server/access";
import { loadTripCards } from "./cards";
import { hasEnded } from "@/lib/dates";
import {
  Badge,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  Page,
  PageHeader,
  Stack,
  cx,
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
  const activeTag = typeof params.tag === "string" ? params.tag : null;

  const viewer = await requireUser("/trips");

  const cards = (await loadTripCards(viewer.id, { archived: false })).map(
    (c) => c.card,
  );

  // Every tag in play, for the filter row. Taken from the trips themselves,
  // so a tag nobody uses any more stops being offered on its own.
  const allTags = [...new Set(cards.flatMap((c) => c.tags ?? []))].sort();
  const filtered = activeTag
    ? cards.filter((c) => c.tags?.includes(activeTag))
    : cards;

  const sorted = sortCards(filtered, sort);

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

      {/* Only worth showing once there is more than one trip to order, and the
          tag row only once anyone has tagged anything. */}
      {cards.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
              Sort
            </span>
            {(Object.keys(SORTS) as Sort[]).map((key) => (
              <ButtonLink
                key={key}
                href={hrefFor({ sort: key, tag: activeTag })}
                variant={key === sort ? "primary" : "secondary"}
                aria-current={key === sort ? "true" : undefined}
              >
                {SORTS[key]}
              </ButtonLink>
            ))}
          </div>
          {allTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
                Tag
              </span>
              {allTags.map((tag) => (
                <a
                  key={tag}
                  // Clicking the tag you're already on clears the filter —
                  // the pill is the toggle, so there's no separate "all".
                  href={hrefFor({ sort, tag: tag === activeTag ? null : tag })}
                  aria-current={tag === activeTag ? "true" : undefined}
                  className={cx(
                    "rounded-sm",
                    tag === activeTag ? "ring-1 ring-pen" : "opacity-80 hover:opacity-100",
                  )}
                >
                  <Badge tone="open">{tag}</Badge>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTag && sorted.length === 0 ? (
        <EmptyState
          title={`No trips tagged “${activeTag}”`}
          action={
            <ButtonLink href={hrefFor({ sort, tag: null })} variant="secondary">
              Show every trip
            </ButtonLink>
          }
        >
          The tag is still on another trip somewhere, or it was just taken off
          this one.
        </EmptyState>
      ) : sorted.length === 0 ? (
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

/** The view as a URL, so sort and tag survive each other's clicks. */
function hrefFor({ sort, tag }: { sort: Sort; tag: string | null }) {
  const query = new URLSearchParams();
  if (sort !== "date") query.set("sort", sort);
  if (tag) query.set("tag", tag);
  const q = query.toString();
  return q ? `/trips?${q}` : "/trips";
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
        {/* No placeholder. A greyed "Milan long weekend" sitting in the box
            reads as a value already there, and the one thing this form asks
            for shouldn't need a second look to see it's empty (ticket 129). */}
        <Field label="Name">
          <Input name="name" required />
        </Field>
        {/* Starting a trip asks one question: what to call it. The dates used
            to be here as an optional pair — a field almost everyone skipped,
            because the Dates tab is where the group actually works out when it
            can go (rule 9: undated is the normal path, not a gap to fill).
            `createTrip` still reads them, so a caller that has real dates can
            pass them. */}
        <SubmitButton pendingLabel="Creating…">Create trip</SubmitButton>
      </Stack>
    </form>
  );
}

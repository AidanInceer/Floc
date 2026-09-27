import { arrangeTripsHome } from "@floc/core/trip/trips-home";
import Link from "next/link";

import { requireUser } from "@/server/access";
import { listFriendsFor, type Person } from "@/server/social/friends";
import { listPendingInvitesFor, type PendingInvite } from "@/server/trips/invites";
import { newTripName } from "@/lib/landing/start-trip";
import { loadTripCards } from "./cards";
import { formatDateRange, hasEnded, splitEnded } from "@floc/core/dates/dates";
import { Avatar, ButtonLink, Stack, cx, PageTitle } from "@/components/system/ui";
import { Sheet, SubmitButton } from "@/components/system/client-ui";
import { FlockChevron } from "@/components/system/flock-chevron";
import type { TripCardData } from "@/components/trip/trip-card";
import { TripFeature } from "@/components/trip/trip-feature";
import { TripShelfCard } from "@/components/trip/trip-shelf-card";
import { NewTripForm } from "@/components/trip/new-trip-form";
import { acceptTripInvite, createTrip, declineTripInvite } from "./actions";

export const metadata = { title: "My trips" };

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tag = typeof params.tag === "string" ? params.tag.trim().toLowerCase() : "";
  const asked = newTripName(params.new);

  const viewer = await requireUser("/trips");

  const [cardRows, invites, friends] = await Promise.all([
    loadTripCards(viewer.id, { archived: false }),
    listPendingInvitesFor(viewer.id),
    listFriendsFor(viewer.id),
  ]);

  const cards = cardRows.map((c) => c.card);
  const ordered = orderCards(
    tag ? cards.filter((card) => card.tags?.some((value) => value.toLowerCase() === tag)) : cards,
  );
  // A finished trip is still yours, so it is folded away rather than dropped —
  // archiving is the other thing, and it is a decision someone has to make.
  const { live, ended } = splitEnded(ordered);
  const { featured, later, undated } = arrangeTripsHome(live);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <PageTitle>My trips</PageTitle>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/trips/archived" variant="ghost">
            Archived
          </ButtonLink>
          <Sheet trigger="New trip" title="Start a trip" body="split" defaultOpen={asked !== null}>
            <NewTripForm action={createTrip} friends={friends} name={asked ?? ""} />
          </Sheet>
        </div>
      </header>

      {invites.length > 0 ? <InviteList invites={invites} /> : null}

      {live.length === 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewTripTile friends={friends} first={cards.length === 0} />
        </ul>
      ) : null}
      {cards.length === 0 ? (
        <p className="mt-4 text-center text-sm text-ink-soft">
          or{" "}
          <Link href="/explore" className="text-pen hover:underline">
            borrow one from Explore
          </Link>
        </p>
      ) : null}
      {featured ? <TripFeature trip={featured} /> : null}

      {later.length > 0 ? (
        <section className="mt-9">
          <h2 className="typed">Later</h2>
          <TripGrid trips={later} className="mt-3" />
        </section>
      ) : null}

      {undated.length > 0 ? (
        <section className="mt-9">
          <h2 className="typed">No dates yet</h2>
          <TripGrid trips={undated} className="mt-3" newTrip={friends} />
        </section>
      ) : null}

      {live.length > 0 && undated.length === 0 ? (
        <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NewTripTile friends={friends} />
        </ul>
      ) : null}

      {ended.length > 0 ? <PastTrips trips={ended} /> : null}
    </div>
  );
}

function TripGrid({
  trips,
  className,
  newTrip,
  past,
}: {
  trips: TripCardData[];
  className?: string;
  newTrip?: Person[];
  past?: boolean;
}) {
  return (
    <ul className={cx(className, "grid gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
      {trips.map((t) => (
        <TripShelfCard key={t.id} trip={t} past={past} />
      ))}
      {newTrip ? <NewTripTile friends={newTrip} /> : null}
    </ul>
  );
}

/**
 * Trips that have finished, folded shut. Native `<details>` — the fold needs
 * no state, so the page stays a server component; the flock chevron is the
 * product's one disclosure mark (see [[flock-chevron]]).
 */
function PastTrips({ trips }: { trips: TripCardData[] }) {
  return (
    <details className="past-trips mt-10">
      <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <FlockChevron size={12} className="past-trips-chevron shrink-0" />
        <span className="typed text-current">Past trips · {trips.length}</span>
      </summary>
      <TripGrid trips={trips} className="mt-5" past />
    </details>
  );
}

/** The last tile in the grid is the way to add another one. */
function NewTripTile({ friends, first }: { friends: Person[]; first?: boolean }) {
  return (
    <li className="contents">
      <Sheet
        bareTrigger
        trigger={
          <span className="block text-left">
            <span className="typed text-current">{first ? "No trips yet" : "One more"}</span>
            <span className="mt-1 block font-display text-2xl font-semibold tracking-tight text-ink">
              Start a trip
            </span>
            <span className="mt-2 block max-w-[32ch] text-sm text-ink-soft">
              Name it, then ask your friends along. Dates can wait.
            </span>
          </span>
        }
        title="Start a trip"
        body="split"
        triggerClassName="lift flex min-h-40 w-full flex-col justify-center rounded-lg bg-sheet p-4 text-left shadow-[inset_0_0_0_1px_var(--rule-2)] hover:shadow-[inset_0_0_0_1px_var(--pen)]"
      >
        <NewTripForm action={createTrip} friends={friends} />
      </Sheet>
    </li>
  );
}

function InviteList({ invites }: { invites: PendingInvite[] }) {
  return (
    <section className="mt-8">
      <p className="typed">
        {invites.length === 1 ? "An invitation" : "Invitations"} · waiting on you
      </p>
      <Stack gap={3} className="mt-3">
        {invites.map((invite) => (
          <div
            key={invite.tripId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pastel-blue-edge bg-pastel-blue px-4 py-3 text-ink"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={invite.fromName} icon={invite.fromAvatarIcon} />
              <div className="min-w-0">
                <p className="text-sm">
                  <strong>{invite.fromName}</strong> invited you to{" "}
                  <strong>{invite.tripName}</strong>
                </p>
                {invite.startDate || invite.endDate ? (
                  <p className="nums text-xs opacity-75">
                    {formatDateRange(invite.startDate, invite.endDate)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <form action={acceptTripInvite}>
                <input type="hidden" name="tripId" value={invite.tripId} />
                <SubmitButton variant="primary" pendingLabel="Joining…">
                  Join
                </SubmitButton>
              </form>
              <form action={declineTripInvite}>
                <input type="hidden" name="tripId" value={invite.tripId} />
                <SubmitButton variant="ghost" pendingLabel="Declining…">
                  Decline
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </Stack>
    </section>
  );
}

function orderCards(cards: TripCardData[]): TripCardData[] {
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

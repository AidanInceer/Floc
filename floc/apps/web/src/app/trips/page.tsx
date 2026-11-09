import { arrangeTripsList } from "@floc/core/trip/trips-home";
import Link from "next/link";

import { requireUser } from "@/server/access";
import { listFriendsFor, type Person } from "@/server/social/friends";
import { listPendingInvitesFor, type PendingInvite } from "@/server/trips/invites";
import { newTripName } from "@/lib/landing/start-trip";
import { loadTripCards } from "./cards";
import { formatDateRange, hasEnded, splitEnded } from "@floc/core/dates/dates";
import { Avatar, ButtonLink, Stack, cx, PageTitle } from "@/components/system/ui";
import { Sheet, SubmitButton } from "@/components/system/client-ui";
import { ChevronIcon, PlusIcon } from "@/components/system/icons";
import type { TripCardData } from "@/components/trip/trip-card";
import { TripBar } from "@/components/trip/trips/trip-bar";
import { NewTripField } from "@/components/trip/trips/new-trip-field";
import { NewTripForm } from "@/components/trip/new-trip-form";
import { acceptTripInvite, createTrip, declineTripInvite } from "./actions";
import "./past-trips.css";

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
  const { dated, undated } = arrangeTripsList(live);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle className="sr-only">My trips</PageTitle>
      <header className="grid grid-cols-[minmax(0,1fr)] gap-1.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="sm:col-start-2">
          <NewTripField action={createTrip} friends={friends} asked={asked} />
        </div>
        <ButtonLink href="/trips/archived" variant="ghost" className="row-start-1 justify-self-end max-sm:h-11 sm:col-start-3">
          Archived
        </ButtonLink>
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
      {dated.length > 0 ? (
        <section className="mt-6">
          <h2 className="sr-only">With dates</h2>
          <TripList trips={dated} next={dated[0]} />
        </section>
      ) : null}

      {undated.length > 0 ? (
        <section className="mt-9">
          <h2 className="typed">No dates yet</h2>
          <TripList trips={undated} className="mt-3" />
        </section>
      ) : null}

      {ended.length > 0 ? <PastTrips trips={ended} /> : null}
    </div>
  );
}

function TripList({
  trips,
  className,
  next,
}: {
  trips: TripCardData[];
  className?: string;
  next?: TripCardData;
}) {
  return (
    <ul className={cx(className, "grid gap-3")}>
      {trips.map((t) => (
        <TripBar key={t.id} trip={t} next={t === next} />
      ))}
    </ul>
  );
}

/**
 * Trips that have finished, folded shut. Native `<details>` — the fold needs
 * no state, so the page stays a server component; the flock chevron is the
 * product's one disclosure mark (see [[icons]]).
 */
function PastTrips({ trips }: { trips: TripCardData[] }) {
  return (
    <details className="past-trips mt-10">
      <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <ChevronIcon direction="down" size={15} className="past-trips-chevron shrink-0" />
        <span className="typed text-current">Past trips · {trips.length}</span>
      </summary>
      <TripList trips={trips} className="mt-5" />
    </details>
  );
}

/** The last row of the list is the way to add another one; with no trips yet it is the whole page's invitation. */
function NewTripTile({ friends, first }: { friends: Person[]; first?: boolean }) {
  return (
    <li className="contents">
      <Sheet
        bareTrigger
        trigger={
          <span className="flex items-center gap-4 text-left">
            {first ? null : (
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-sm bg-pen-soft text-pen-deep">
                <PlusIcon />
              </span>
            )}
            <span className="block">
              {first ? <span className="typed text-current">No trips yet</span> : null}
              <span className={cx("block font-display font-semibold tracking-tight text-ink", first ? "mt-1 text-2xl" : "text-lg")}>
                Start a trip
              </span>
              <span className={cx("block text-balance text-sm text-ink-soft", first ? "mt-2" : "")}>
                Name it, then ask your friends along. Dates can wait.
              </span>
            </span>
          </span>
        }
        title="Start a trip"
        body="split"
        triggerClassName={cx(
          "lift flex w-full flex-col justify-center rounded-md bg-sheet p-4 text-left shadow-[inset_0_0_0_1px_var(--rule-2)] hover:shadow-[inset_0_0_0_1px_var(--pen)]",
          first ? "min-h-40" : "",
        )}
      >
        <NewTripForm action={createTrip} friends={friends} />
      </Sheet>
    </li>
  );
}

function InviteList({ invites }: { invites: PendingInvite[] }) {
  return (
    <section className="mt-8">
      <Stack gap={3}>
        {invites.map((invite) => (
          <div
            key={invite.tripId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-pastel-blue-edge bg-pastel-blue px-4 py-3 text-ink"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={invite.fromName} />
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

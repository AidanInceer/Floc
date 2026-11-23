import { arrangeTripsList } from "@floc/core/trip/trips-home";

import { requireUser } from "@/server/access";
import { listFriendsFor } from "@/server/social/friends";
import { listGroupsFor } from "@/server/social/groups";
import { listPendingInvitesFor, type PendingInvite } from "@/server/trips/invites";
import { newTripName, wishListParam } from "@/lib/landing/start-trip";
import { wishListPeopleToAsk } from "@/server/wish-lists/wish-lists";
import { loadTripCards } from "./cards";
import { formatDateRange, hasEnded, splitEnded } from "@floc/core/dates/dates";
import { Avatar, ButtonLink, Stack, cx, PageTitle } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";
import type { TripCardData } from "@/components/trip/trip-card";
import { PastTripsSection } from "@/components/trip/trips/past-trip-maps";
import { TripBar } from "@/components/trip/trips/trip-bar";
import { NewTripField } from "@/components/trip/trips/new-trip-field";
import { TripDoors } from "@/components/onboarding/trip-doors";
import { WelcomeModal } from "@/components/onboarding/welcome/welcome-modal";
import { welcomeFor } from "@/server/auth/welcome/welcome";
import { startPeople, welcomeView } from "@/server/auth/welcome/welcome-view";
import { acceptTripInvite, declineTripInvite } from "./actions";
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

  const wishId = wishListParam(params.wish);

  const [cardRows, invites, friends, groups, along, welcomeState] = await Promise.all([
    loadTripCards(viewer.id, { archived: false }),
    listPendingInvitesFor(viewer.id),
    listFriendsFor(viewer.id),
    listGroupsFor(viewer.id),
    wishId ? wishListPeopleToAsk(viewer.id, wishId) : Promise.resolve([]),
    welcomeFor(viewer.id),
  ]);

  const people = startPeople([friends, ...groups.map((g) => g.members), along]);
  const welcome = await welcomeView(viewer, people, null, welcomeState);
  const cards = cardRows.map((c) => c.card);
  const ordered = orderCards(
    tag ? cards.filter((card) => card.tags?.some((value) => value.toLowerCase() === tag)) : cards,
  );
  const { live, ended } = splitEnded(ordered);
  const { dated, undated } = arrangeTripsList(live);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle className="sr-only">My trips</PageTitle>
      <header className="flex justify-center">
        <NewTripField me={viewer.name} people={people} asked={asked} along={along.map((p) => p.id)} />
      </header>

      {invites.length > 0 ? <InviteList invites={invites} /> : null}

      {cards.length === 0 ? <TripDoors /> : null}
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

      <div className="relative mt-10 min-h-[31px]">
        <ButtonLink href="/trips/archived" variant="ghost" className="absolute right-0 top-0">
          Archived
        </ButtonLink>
        {ended.length > 0 ? <PastTrips trips={ended} /> : null}
      </div>
      {welcome ? <WelcomeModal {...welcome} /> : null}
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

function PastTrips({ trips }: { trips: TripCardData[] }) {
  return (
    <PastTripsSection count={trips.length}>
      <TripList trips={trips} className="mt-5" />
    </PastTripsSection>
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
                <SubmitButton variant="primary">
                  Join
                </SubmitButton>
              </form>
              <form action={declineTripInvite}>
                <input type="hidden" name="tripId" value={invite.tripId} />
                <SubmitButton variant="ghost">
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

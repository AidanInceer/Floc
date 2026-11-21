import { buildPresetPlan } from "@floc/core/trip/explore/detail/preset-plan";
import { presetDetail } from "@floc/core/trip/explore/detail/preset-details";
import { tripKnow } from "@floc/core/trip/explore/know/trip-knows";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TripHero } from "@/components/explore/trip/trip-hero";
import { TripKnow } from "@/components/explore/trip/trip-know";
import { TripPlan } from "@/components/explore/trip/trip-plan";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { ChevronIcon } from "@/components/system/icons";
import { buttonClass, cx } from "@/components/system/ui";
import { ListingWishProvider } from "@/components/lists/wish/listing-wish";
import { wishListParam } from "@/lib/landing/start-trip";
import { listWishListsFor, wishListPeopleToAsk } from "@/server/wish-lists/wish-lists";
import { getSession } from "@/server/access";
import { savedTripIds } from "@/server/explore/explore-saves";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { listFriendsFor } from "@/server/social/friends";
import { listGroupsFor } from "@/server/social/groups";
import { startPeople } from "@/server/auth/welcome/welcome-view";
import { publicMetadata } from "@/lib/seo/public-pages";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ start?: string | string[]; wish?: string | string[] }> };

const findTrip = (slug: string) => PRESET_TRIPS.find((t) => t.id === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = findTrip((await params).slug);
  return trip
    ? publicMetadata({
        path: `/explore/${trip.id}`,
        title: `${trip.title} · Explore`,
        description: trip.summary,
        card: `/explore/${trip.id}/opengraph-image`,
      })
    : {};
}

async function peopleFor(userId: string | null, wishId: number | null) {
  if (!userId) return { along: [], people: [] };
  const [along, friends, groups] = await Promise.all([
    wishId ? wishListPeopleToAsk(userId, wishId) : [],
    listFriendsFor(userId),
    listGroupsFor(userId),
  ]);
  return { along, people: startPeople([friends, ...groups.map((g) => g.members), along]) };
}

export default async function ExploreTripPage({ params, searchParams }: Props) {
  const trip = findTrip((await params).slug);
  if (!trip) notFound();
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const query = await searchParams;
  const wishId = wishListParam(query.wish);
  const [rates, saved, wish, { along, people }] = await Promise.all([
    viewerCurrency(userId, await headers()).then(listingRates),
    userId ? savedTripIds(userId) : [],
    userId ? listWishListsFor(userId) : null,
    peopleFor(userId, wishId),
  ]);
  const plan = buildPresetPlan(trip, presetDetail(trip.id));
  const lists = wish?.lists.map(({ id, title }) => ({ id, title })) ?? [];

  return (
    <SavedTripsProvider ids={saved} signedIn={!!userId}>
      <ListingWishProvider value={{ lists, along, me: session?.user?.name ?? "", people }}>
        <div className="mx-auto w-full max-w-[84rem] px-4 pb-32 pt-6 sm:px-6 lg:pb-24">
          <Link href="/explore" className={cx(buttonClass("ghost"), "mb-3")}>
            <ChevronIcon direction="left" size={12} />
            Every trip
          </Link>
          <TripHero trip={trip} figures={plan.inPlan} rates={rates} />
          <TripPlan trip={trip} plan={plan} signedIn={!!userId} startOpen={query.start !== undefined} />
          <TripKnow know={tripKnow(trip.id)} />
        </div>
      </ListingWishProvider>
    </SavedTripsProvider>
  );
}

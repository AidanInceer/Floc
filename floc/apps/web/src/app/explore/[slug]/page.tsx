/**
 * /explore/[slug] — one listing, laid out so a group can read it and copy it
 * (#335). Public and static in content, like /explore. A listing whose days
 * nobody has written yet still gets its route and figures.
 */
import { buildPresetPlan } from "@floc/core/trip/explore/detail/preset-plan";
import { presetDetail } from "@floc/core/trip/explore/detail/preset-details";
import { tripKnow } from "@floc/core/trip/explore/know/trip-knows";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { TripHero } from "@/components/explore/trip/trip-hero";
import { TripKnow } from "@/components/explore/trip/trip-know";
import { TripPlan } from "@/components/explore/trip/trip-plan";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { getSession } from "@/server/access";
import { savedTripIds } from "@/server/explore/explore-saves";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ start?: string | string[] }> };

const findTrip = (slug: string) => PRESET_TRIPS.find((t) => t.id === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = findTrip((await params).slug);
  return trip ? { title: `${trip.title} · Explore`, description: trip.summary } : {};
}

export default async function ExploreTripPage({ params, searchParams }: Props) {
  const trip = findTrip((await params).slug);
  if (!trip) notFound();
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const [rates, saved] = await Promise.all([
    viewerCurrency(userId, await headers()).then(listingRates),
    userId ? savedTripIds(userId) : [],
  ]);
  const plan = buildPresetPlan(trip, presetDetail(trip.id));

  return (
    <SavedTripsProvider ids={saved} signedIn={!!userId}>
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-32 pt-6 sm:px-6 lg:pb-24">
        <TripHero trip={trip} figures={plan.inPlan} rates={rates} />
        <TripPlan trip={trip} plan={plan} signedIn={!!userId} startOpen={(await searchParams).start !== undefined} />
        <TripKnow know={tripKnow(trip.id)} />
      </div>
    </SavedTripsProvider>
  );
}

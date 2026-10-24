/**
 * /explore/[slug] — one listing, laid out so a group can read it and copy it
 * (#335). Public and static in content, like /explore. A listing whose days
 * nobody has written yet still gets its route, figures and facts.
 */
import { buildPresetPlan } from "@floc/core/trip/explore/detail/preset-plan";
import { presetDetail } from "@floc/core/trip/explore/detail/preset-details";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TripHero } from "@/components/explore/trip/trip-hero";
import { TripKnow } from "@/components/explore/trip/trip-know";
import { TripPlan } from "@/components/explore/trip/trip-plan";
import { getSession } from "@/server/access";

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
  const plan = buildPresetPlan(trip, presetDetail(trip.id));

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-32 pt-6 sm:px-6 lg:pb-24">
      <TripHero trip={trip} figures={plan.inPlan} />
      <TripPlan trip={trip} plan={plan} signedIn={!!session?.user?.id} startOpen={(await searchParams).start !== undefined} />
      <TripKnow advice={plan.advice} facts={plan.goodToKnow} />
    </div>
  );
}

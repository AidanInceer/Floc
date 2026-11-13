import type { PresetFigure } from "@floc/core/trip/explore/detail/preset-detail-types";
import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import Link from "next/link";

import { TripMap } from "@/components/explore/trip/trip-map";
import { PostcardStamp } from "@/components/explore/postcard-stamp";
import { SaveHeart } from "@/components/explore/save/save-heart";
import "@/components/explore/explore-postcard.css";
import { PageTitle } from "@/components/system/ui";
import { listingPrice, type ListingRates } from "@floc/core/trip/explore/listing-price";

export function TripHero({ trip, figures, rates }: { trip: PresetTrip; figures: PresetFigure[]; rates: ListingRates | null }) {
  const stops = stopsOf(trip);
  const facts = [
    ["Nights", String(trip.nights)],
    ["Stops", String(stops.length)],
    ["Group", trip.groupSize.replace(" people", "")],
    ["From, each", listingPrice(trip, rates)],
  ];
  return (
    <section className="explore-postcard relative grid items-center gap-6 rounded-md bg-sheet p-4 shadow-lifted sm:p-6 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:p-7">
      <TripMap trip={trip} />
      <SaveHeart presetId={trip.id} title={trip.title} className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4 lg:hidden" />
      <div className="relative">
        <div className="absolute right-0 top-0 flex items-start gap-3 max-sm:hidden">
          <PostcardStamp trip={trip} />
          {/* Why: on a wide screen the heart sits in the stamp's row, so the two share a top edge whatever the map's height. */}
          <SaveHeart presetId={trip.id} title={trip.title} className="!border !border-rule !shadow-none max-lg:hidden" />
        </div>
        <p className="typed sm:pr-24 lg:pr-36">
          <Link href="/explore" className="hover:text-ink">
            Explore
          </Link>{" "}
          / {trip.region} / {trip.country}
        </p>
        <PageTitle className="mt-2.5 tracking-[-0.025em] sm:pr-24 lg:pr-36">{trip.title}</PageTitle>
        <p className="mt-3 max-w-[56ch] text-md text-ink-soft">{trip.summary}</p>
        <dl className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 border-y border-rule py-3.5">
          {facts.map(([label, value]) => (
            <div key={label} className="grid gap-0.5">
              <dt className="typed">{label}</dt>
              <dd className="nums text-md">{value}</dd>
            </div>
          ))}
          <div className="grid gap-0.5">
            <dt className="typed">Best in</dt>
            <dd>{trip.bestMonths}</dd>
          </div>
        </dl>
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {figures.map((f) => (
            <li key={f.label} className="grid content-start gap-0.5 rounded-md bg-sheet-2 px-3.5 py-3">
              <b className="nums font-display text-[length:var(--text-2xl)] font-semibold leading-tight tracking-[-0.02em]">{f.value}</b>
              <span className="text-[13px] text-ink-soft">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

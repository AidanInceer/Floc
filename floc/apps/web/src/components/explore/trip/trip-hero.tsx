import { formatMoney } from "@floc/core/money/money";
import type { PresetFigure } from "@floc/core/trip/explore/detail/preset-detail-types";
import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import Link from "next/link";

import { TripMap } from "@/components/explore/trip/trip-map";
import { PostcardStamp } from "@/components/explore/postcard-stamp";
import "@/components/explore/explore-postcard.css";
import { PageTitle } from "@/components/system/ui";

export function TripHero({ trip, figures }: { trip: PresetTrip; figures: PresetFigure[] }) {
  const stops = stopsOf(trip);
  const facts = [
    ["Nights", String(trip.nights)],
    ["Stops", String(stops.length)],
    ["Group", trip.groupSize.replace(" people", "")],
    ["From, each", formatMoney(trip.priceFromMinor, trip.currency)],
  ];
  return (
    <section className="explore-postcard grid items-center gap-6 rounded-md bg-sheet p-4 shadow-lifted sm:p-6 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:p-7">
      <TripMap trip={trip} />
      <div className="relative">
        <div className="absolute right-0 top-0 max-sm:hidden">
          <PostcardStamp trip={trip} />
        </div>
        <p className="typed sm:pr-24">
          <Link href="/explore" className="hover:text-ink">
            Explore
          </Link>{" "}
          / {trip.region} / {trip.country}
        </p>
        <PageTitle className="mt-2.5 tracking-[-0.025em] sm:pr-24">{trip.title}</PageTitle>
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
        <p className="typed mt-5">In the plan</p>
        <ul className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {figures.map((f) => (
            <li key={f.label} className="grid content-start gap-0.5 rounded-md bg-sheet-2 px-3.5 py-3">
              <b className="nums font-display text-[length:var(--text-2xl)] font-semibold leading-tight tracking-[-0.02em]">{f.value}</b>
              <span className="text-[12.5px] text-ink-soft">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { CopySheet } from "@/components/explore/copy/copy-sheet";
import { PostcardStamp } from "@/components/explore/postcard-stamp";
import { ButtonLink } from "@/components/system/ui";
import "./explore-postcard.css";

const kicker = "font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-faint";

export function ExplorePostcard({ trip, signedIn }: { trip: PresetTrip; signedIn: boolean }) {
  return (
    <article key={trip.id} className="explore-postcard flex flex-col gap-4 rounded-md bg-sheet p-6 text-left text-ink shadow-lifted sm:px-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={kicker}>
            {trip.region} · {trip.country}
          </span>
          <h2 className="mt-2 text-[30px] leading-none tracking-[-0.03em]">{trip.title}</h2>
        </div>
        <PostcardStamp trip={trip} />
      </div>
      <p className="text-md leading-normal">{trip.summary}</p>
      <dl className="flex flex-col text-[13px]">
        {[
          ["Group", trip.groupSize],
          ["From", `${formatMoney(trip.priceFromMinor, trip.currency)} each`],
          ["Best in", trip.bestMonths],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-[5.5rem_1fr] border-b border-rule py-[7px]">
            <dt className={kicker + " pt-0.5"}>{label}</dt>
            <dd className="nums">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-wrap gap-1.5">
        {trip.highlights.map((h) => (
          <li key={h} className="rounded-full bg-sheet-2 px-2.5 py-1 text-xs text-ink-soft">
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap items-center gap-3.5">
        {signedIn ? (
          <CopySheet trip={trip}>Start this trip</CopySheet>
        ) : (
          <ButtonLink href="/signup" variant="primary">
            Sign up to start
          </ButtonLink>
        )}
        <ButtonLink href={`/explore/${trip.id}`}>See the full trip</ButtonLink>
        <span className="text-xs text-ink-faint">Free. You can change every part.</span>
      </div>
    </article>
  );
}

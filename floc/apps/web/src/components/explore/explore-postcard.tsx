"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { startTripFromPreset } from "@/app/explore/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink } from "@/components/system/ui";
import "./explore-postcard.css";

const kicker = "font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-faint";

export function ExplorePostcard({ trip, signedIn }: { trip: PresetTrip; signedIn: boolean }) {
  return (
    <article key={trip.id} className="explore-postcard flex flex-col gap-4 rounded-[22px] bg-sheet p-6 text-left text-ink shadow-lifted sm:px-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={kicker}>
            {trip.region} · {trip.country}
          </span>
          <h2 className="mt-2 text-[30px] leading-none tracking-[-0.03em]">{trip.title}</h2>
        </div>
        <div className="flex w-[74px] shrink-0 rotate-3 flex-col rounded-md border-[1.5px] border-dashed border-rule-strong bg-sheet px-1.5 py-2 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-soft">
          <span className="truncate">{trip.country}</span>
          <b className="nums font-display text-[28px] font-semibold normal-case leading-[1.1] tracking-[-0.03em] text-ink">{trip.nights}</b>
          <span>nights</span>
        </div>
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
          <form action={startTripFromPreset}>
            <input type="hidden" name="presetId" value={trip.id} />
            <SubmitButton pendingLabel="Starting…">Start this trip</SubmitButton>
          </form>
        ) : (
          <ButtonLink href="/signup" variant="primary">
            Sign up to start
          </ButtonLink>
        )}
        <span className="text-xs text-ink-faint">Free. You can change every part.</span>
      </div>
    </article>
  );
}

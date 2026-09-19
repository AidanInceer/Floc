"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { startTripFromPreset } from "@/app/explore/actions";
import { PinGlyph } from "@/components/explore/explore-glyphs";
import { legLine, skinFor } from "@/components/explore/listing";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink, cx } from "@/components/system/ui";

export function ExploreSide({ trip, signedIn }: { trip: PresetTrip; signedIn: boolean }) {
  return (
    <aside className="flex flex-col gap-4 border-t border-rule p-5 lg:border-l lg:border-t-0">
      <div>
        <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs", skinFor(trip))}>
          <PinGlyph /> {trip.region}
        </span>
        <h2 className="mt-2 text-[23px] leading-tight">{trip.title}</h2>
        <p className="nums mt-1 text-xs text-ink-soft">
          {trip.nights} nights · {trip.groupSize} · {formatMoney(trip.priceFromMinor, trip.currency)} each
        </p>
      </div>

      <ol className="ml-1.5 border-l-[1.5px] border-rule-strong">
        {trip.legs.map((leg, i) => (
          <li
            key={`${leg.place}-${i}`}
            className="relative py-0.5 pb-2 pl-4 text-sm before:absolute before:-left-[5px] before:top-2 before:size-2 before:rounded-full before:border-[1.5px] before:border-ink before:bg-sheet"
          >
            {legLine(leg)}
          </li>
        ))}
      </ol>

      <div className="mt-auto flex gap-2">
        {signedIn ? (
          <form action={startTripFromPreset} className="flex-1">
            <input type="hidden" name="presetId" value={trip.id} />
            <SubmitButton pendingLabel="Starting…" className="w-full">
              Start this trip
            </SubmitButton>
          </form>
        ) : (
          <ButtonLink href="/signup" variant="primary" className="flex-1">
            Sign up to start
          </ButtonLink>
        )}
      </div>
    </aside>
  );
}

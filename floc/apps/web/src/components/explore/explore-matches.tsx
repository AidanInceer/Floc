"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { ArrowGlyph } from "@/components/explore/explore-glyphs";
import { skinFor } from "@/components/explore/listing";
import { cx } from "@/components/system/ui";

export function ExploreMatches({
  matches,
  onPick,
}: {
  matches: { trip: PresetTrip; score: number }[];
  onPick: (presetId: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-rule-strong p-4 text-sm text-ink-soft">
        No trips are that short. Move the longest trip up.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-2.5">
      {matches.map(({ trip }, index) => (
        <li key={trip.id}>
          <button
            type="button"
            onClick={() => onPick(trip.id)}
            className={cx("lift flex w-full items-center gap-4 rounded-lg p-4 text-left", skinFor(trip))}
          >
            <span className="nums w-8 font-display text-[26px] font-bold leading-none">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[17px] font-bold leading-tight">{trip.title}</span>
              <span className="nums block text-xs opacity-85">
                {trip.nights} nights · {formatMoney(trip.priceFromMinor, trip.currency)} each
              </span>
            </span>
            <ArrowGlyph />
          </button>
        </li>
      ))}
    </ol>
  );
}

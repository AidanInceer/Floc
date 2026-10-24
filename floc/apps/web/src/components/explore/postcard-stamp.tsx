import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { countryNames } from "@/components/explore/outline/country";

/** The tilted stamp in a postcard's corner: where, and how many nights. */
export function PostcardStamp({ trip }: { trip: PresetTrip }) {
  return (
    <div className="flex w-[74px] shrink-0 rotate-3 flex-col rounded-md border-[1.5px] border-dashed border-rule-strong bg-sheet px-1.5 py-2 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-soft">
      <span className="truncate">{countryNames(trip.country).length > 1 ? trip.region : trip.country}</span>
      <b className="nums font-display text-[28px] font-semibold normal-case leading-[1.1] tracking-[-0.03em] text-ink">{trip.nights}</b>
      <span>nights</span>
    </div>
  );
}

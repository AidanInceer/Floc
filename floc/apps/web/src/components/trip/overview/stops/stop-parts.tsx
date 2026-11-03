import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { EventGlyph } from "@/components/system/icons/days";
import { cx } from "@/components/system/ui";

/** "Lisbon, Portugal" is "Lisbon" here; the country is on the map. */
export const cityOf = (placeName: string) => placeName.split(",")[0];

export function StopNo({ no, small }: { no: number; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "shrink-0 font-display font-semibold tabular-nums leading-none text-pen",
        small ? "w-[22px] text-center text-sm" : "border-r-[1.5px] border-rule-strong pr-3 text-xl",
      )}
    >
      {no}
    </span>
  );
}

export function KindTile({ type, transportType }: { type: DayEventType; transportType: TransportType | null }) {
  return (
    <span className={cx("relative z-[1] grid size-[26px] shrink-0 place-items-center rounded-sm", EVENT_CATEGORIES[type].tile)}>
      <EventGlyph type={type} transportType={transportType} />
    </span>
  );
}

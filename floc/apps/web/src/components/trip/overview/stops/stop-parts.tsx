import { formatDate } from "@floc/core/dates/dates";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { EventGlyph } from "@/components/days/days-glyphs";
import { cx } from "@/components/system/ui";

/** "Lisbon, Portugal" is "Lisbon" here; the country is on the map. */
export const cityOf = (placeName: string) => placeName.split(",")[0];

export const stopDates = (leg: { arrive: string; leave: string }) => `${formatDate(leg.arrive)} – ${formatDate(leg.leave)}`;

/** Same ring and number as the map's pin — one stop drawn twice. */
export function StopNo({ no, small }: { no: number; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "nums grid shrink-0 place-items-center rounded-full border-2 border-pen font-mono font-bold text-pen",
        small ? "size-[22px] text-[10px]" : "size-[26px] text-[11px]",
      )}
    >
      {no}
    </span>
  );
}

const KIND: Record<DayEventType, string> = {
  activity: "bg-pastel-green text-pastel-green-ink",
  transport: "bg-pastel-blue text-pastel-blue-ink",
  food: "bg-pastel-red text-pastel-red-ink",
};

export function KindTile({ type, transportType }: { type: DayEventType; transportType: TransportType | null }) {
  return (
    <span className={cx("relative z-[1] grid size-[26px] shrink-0 place-items-center rounded-sm", KIND[type])}>
      <EventGlyph type={type} transportType={transportType} />
    </span>
  );
}

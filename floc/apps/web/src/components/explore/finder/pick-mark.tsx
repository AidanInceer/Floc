import { WeatherGlyph } from "@/components/system/icons/weather";

/**
 * This season's top pick (#624): a small sun in the bottom right of the tile, with no box, so it stays quieter than
 * the heart (Aidan). Its words live in the label. It sits inside the tile's link, so a press on it opens the trip.
 */
export function PickMark({ label }: { label: string }) {
  return (
    <span role="img" aria-label={label} title={label} className="absolute bottom-[17px] right-3.5 z-10 text-highlight-ink">
      <WeatherGlyph condition="sun" size={14} />
    </span>
  );
}

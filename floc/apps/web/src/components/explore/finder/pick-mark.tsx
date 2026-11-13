import { cornerBoxClass } from "@/components/explore/save/save-heart";
import { WeatherGlyph } from "@/components/system/icons/weather";
import { cx } from "@/components/system/ui";

/**
 * This season's top pick (#624): a sun in the tile's top corner, opposite the heart. Its words live in the label.
 * It sits inside the tile's link, so a press on it opens the trip; no shadow, so it does not read as a button.
 */
export function PickMark({ label }: { label: string }) {
  return (
    <span role="img" aria-label={label} title={label} className={cx(cornerBoxClass, "absolute left-2.5 top-2.5 z-10 text-highlight-ink")}>
      <WeatherGlyph condition="sun" size={16} />
    </span>
  );
}

import { WeatherGlyph } from "@/components/system/icons/weather";

export function PickMark({ label }: { label: string }) {
  return (
    <span role="img" aria-label={label} title={label} className="absolute bottom-[17px] right-3.5 z-10 text-highlight-ink">
      <WeatherGlyph condition="sun" size={14} />
    </span>
  );
}

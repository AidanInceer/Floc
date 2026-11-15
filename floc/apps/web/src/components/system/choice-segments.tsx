import { SegmentTrack } from "./segment-track";
import { cx, trackRadioClass } from "./ui";

export function ChoiceSegments<T extends string>({
  name,
  labelledBy,
  options,
  labels,
  value,
}: {
  name: string;
  labelledBy: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
}) {
  return (
    <SegmentTrack role="radiogroup" aria-labelledby={labelledBy} className={cx("flex flex-wrap gap-0.5", options.length === 4 && "max-sm:grid max-sm:grid-cols-2")}>
      {options.map((o) => (
        <label key={o} className="flex-auto">
          <input type="radio" name={name} value={o} defaultChecked={o === value} className="peer sr-only" />
          <span className={cx(trackRadioClass, "whitespace-nowrap px-3 py-1.5 text-sm")}>{labels[o]}</span>
        </label>
      ))}
    </SegmentTrack>
  );
}

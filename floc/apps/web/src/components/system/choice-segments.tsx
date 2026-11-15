import { cx, segmentTrack } from "./ui";

const chip =
  "block cursor-pointer whitespace-nowrap rounded-sm px-3 py-1.5 text-center text-sm font-medium text-ink-soft transition-colors duration-220 ease-(--ease) hover:bg-pen-soft hover:text-pen-deep peer-checked:bg-pen-soft peer-checked:text-pen-deep peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-pen";

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
    <div role="radiogroup" aria-labelledby={labelledBy} className={cx(segmentTrack, "flex flex-wrap gap-0.5")}>
      {options.map((o) => (
        <label key={o} className="flex-auto">
          <input type="radio" name={name} value={o} defaultChecked={o === value} className="peer sr-only" />
          <span className={chip}>{labels[o]}</span>
        </label>
      ))}
    </div>
  );
}

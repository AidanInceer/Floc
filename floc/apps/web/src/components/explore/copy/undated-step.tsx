import { CheckIcon } from "@/components/system/icons";
import { panelTitleClass } from "@/components/system/ui";

/** Not yet (ADR-025): an undated copy brings the highlights page only, since a day cannot exist without a date. */
export function UndatedStep({ highlights }: { highlights: string[] }) {
  return (
    <div className="grid gap-4">
      <h3 tabIndex={-1} className={`${panelTitleClass} text-center`}>What comes across</h3>
      <p className="flex items-start gap-2.5">
        <span className="mt-0.5 text-green">
          <CheckIcon />
        </span>
        <span>
          <span className="block text-sm text-ink">{highlights.length} highlights</span>
          <span className="mt-0.5 block text-xs text-ink-faint">{highlights.join(", ")}</span>
        </span>
      </p>
      <p className="rounded-sm bg-pastel-yellow px-3 py-2.5 text-xs text-pastel-yellow-ink">
        The stops, days and ideas need dates. Go back and pick them to bring those too.
      </p>
    </div>
  );
}

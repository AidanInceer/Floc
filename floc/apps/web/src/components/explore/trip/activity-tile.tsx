import type { ActivityKind } from "@floc/core/trip/explore/detail/activity-kind";

import { StarIcon } from "@/components/system/icons/explore-trip";
import { ActivityGlyph } from "@/components/system/icons/activity";
import { cx } from "@/components/system/ui";

const TONE: Record<ActivityKind, string> = {
  flight: "bg-pastel-blue text-pastel-blue-ink",
  train: "bg-pastel-blue text-pastel-blue-ink",
  ferry: "bg-pastel-blue text-pastel-blue-ink",
  drive: "bg-pastel-blue text-pastel-blue-ink",
  food: "bg-pastel-red text-pastel-red-ink",
  walk: "bg-pastel-green text-pastel-green-ink",
  rest: "bg-sheet-2 text-ink-soft",
  stay: "bg-sheet-2 text-ink-soft",
  sight: "bg-sheet-2 text-ink-soft",
  free: "border-[1.5px] border-dashed border-green-edge text-green",
};

export function ActivityTile({ kind, highlight }: { kind: ActivityKind; highlight?: boolean }) {
  return (
    <span
      className={cx(
        "relative z-[1] grid size-[26px] shrink-0 place-items-center rounded-sm",
        highlight ? "border border-highlight-edge bg-highlight text-highlight-ink" : TONE[kind],
      )}
    >
      {highlight ? <StarIcon className="fill-current" /> : <ActivityGlyph kind={kind} />}
    </span>
  );
}

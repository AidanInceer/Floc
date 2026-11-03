import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import type { ActivityKind } from "@floc/core/trip/explore/detail/activity-kind";

import { StarIcon } from "@/components/system/icons/explore-trip";
import { ActivityGlyph } from "@/components/system/icons/activity";
import { cx } from "@/components/system/ui";

const TONE: Record<ActivityKind, string> = {
  flight: EVENT_CATEGORIES.transport.tile,
  train: EVENT_CATEGORIES.transport.tile,
  ferry: EVENT_CATEGORIES.transport.tile,
  drive: EVENT_CATEGORIES.transport.tile,
  food: EVENT_CATEGORIES.food.tile,
  walk: EVENT_CATEGORIES.activity.tile,
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

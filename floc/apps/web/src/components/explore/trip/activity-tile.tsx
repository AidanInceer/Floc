import type { ActivityKind } from "@floc/core/trip/explore/detail/activity-kind";

import { StarIcon } from "@/components/explore/trip/trip-glyphs";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import { LineIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

const TRAVEL = { flight: "flight", train: "train", ferry: "ferry", drive: "car" } as const;

const PATHS: Record<Exclude<ActivityKind, keyof typeof TRAVEL>, string[]> = {
  sight: ["M2.2 12.2h9.6M3.2 12.2V6.4M10.8 12.2V6.4M3.2 6.4a3.8 3.8 0 0 1 7.6 0", "M5.6 12.2V8.6a1.4 1.4 0 0 1 2.8 0v3.6"],
  walk: [
    "M4.2 2.2c1.3 0 2 1.3 1.8 3.2-.1 1.2-.6 2-1.6 2S2.8 6.5 2.8 5c0-1.6.4-2.8 1.4-2.8Z",
    "M3 9.2h2.6M9.8 5c1 0 1.4 1.2 1.4 2.8 0 1.5-.6 2.4-1.6 2.4S8 9.4 8 8.2C7.8 6.3 8.5 5 9.8 5Z",
    "M8.4 12h2.6",
  ],
  food: ["M4 1.8v4.4M2.6 1.8v3a1.4 1.4 0 0 0 2.8 0v-3M4 6.2v6", "M10.4 12.2V1.8c-1.4.6-2.2 2.2-2.2 4.4 0 1.2.6 2 2.2 2"],
  rest: ["M1.8 9.4h10.4M2.6 9.4c0 1.6 1.2 2.6 4.4 2.6s4.4-1 4.4-2.6", "M5 2.2c-.6.8.6 1.4 0 2.4M7.4 2.2c-.6.8.6 1.4 0 2.4M9.8 2.2c-.6.8.6 1.4 0 2.4"],
  stay: ["M1.8 11.6V4M1.8 8.6h10.4v3M12.2 8.6V7.4a1.6 1.6 0 0 0-1.6-1.6H6.6v2.8", "M4.2 5.5a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"],
  free: ["M7 4.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z", "M7 1.6v1.2M7 11.2v1.2M1.6 7h1.2M11.2 7h1.2M3.2 3.2l.8.8M10 10l.8.8M3.2 10.8l.8-.8M10 4l.8-.8"],
};

export function ActivityGlyph({ kind, size = 13 }: { kind: ActivityKind; size?: number }) {
  if (kind in TRAVEL) return <TravelModeIcon mode={TRAVEL[kind as keyof typeof TRAVEL]} size={size} />;
  return (
    <LineIcon size={size}>
      {PATHS[kind as keyof typeof PATHS].map((d) => (
        <path key={d} d={d} />
      ))}
    </LineIcon>
  );
}

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
        "relative z-[1] grid size-[26px] shrink-0 place-items-center rounded-[8px]",
        highlight ? "border border-highlight-edge bg-highlight text-highlight-ink" : TONE[kind],
      )}
    >
      {highlight ? <StarIcon className="fill-current" /> : <ActivityGlyph kind={kind} />}
    </span>
  );
}

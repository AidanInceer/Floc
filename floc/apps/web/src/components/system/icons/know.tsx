import type { KnowIcon as KnowIconName } from "@floc/core/trip/explore/know/know-types";

import { LineIcon } from "@/components/system/icons";
import { FLIGHT_PATH } from "@/components/system/icons/travel-mode";

export type KnowGlyphName = KnowIconName | "chevron" | "clock" | "external";

const PATHS: Record<KnowGlyphName, string[]> = {
  train: ["M3 1.8h8a1 1 0 0 1 1 1v6.4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2.8a1 1 0 0 1 1-1Z", "M2 6.4h10M5 12.2l1-2M9 12.2l-1-2"],
  car: ["M2.2 9.8V7.3l1.3-3a1 1 0 0 1 .9-.6h5.2a1 1 0 0 1 .9.6l1.3 3v2.5Z", "M2.2 7.3h9.6M4.2 9.8v1.4M9.8 9.8v1.4"],
  boat: ["M2.6 6.7 7 5.2l4.4 1.5-1.3 3.6H3.9Z", "M7 5.2V1.8", "M1.5 11.6c1.2 0 1.2.9 2.4.9s1.2-.9 2.4-.9 1.2.9 2.4.9 1.2-.9 2.4-.9"],
  plane: [FLIGHT_PATH],
  walk: ["M7.6 1.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z", "M7 5 5.6 7.8l1.7 1.5.4 3M7 5l2 1.8 1.4.3M5.6 7.8 4 9.6"],
  weather: ["M5.1 2.7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z", "M5.1 1.2v.8M1.6 4.7h.8M7.8 4.7h.8", "M6.2 11.9a2.4 2.4 0 0 1 .3-4.8 3.1 3.1 0 0 1 5.8 1.2 1.9 1.9 0 0 1-.5 3.6Z"],
  sun: ["M7 4.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z", "M7 1.6v1.2M7 11.2v1.2M1.6 7h1.2M11.2 7h1.2M3.2 3.2l.8.8M10 10l.8.8M3.2 10.8l.8-.8M10 4l.8-.8"],
  moon: ["M11.6 8.6A4.8 4.8 0 1 1 5.4 2.4a3.8 3.8 0 0 0 6.2 6.2Z"],
  drop: ["M7 1.8S3.4 6 3.4 8.6a3.6 3.6 0 0 0 7.2 0C10.6 6 7 1.8 7 1.8Z"],
  passport: ["M3 1.8h8v10.4H3Z", "M7 4.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z", "M5 9.8h4"],
  pin: ["M7 12.4S2.8 8.6 2.8 5.8a4.2 4.2 0 0 1 8.4 0c0 2.8-4.2 6.6-4.2 6.6Z", "M7 4.3a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z"],
  money: ["M7 1.8a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 0 0 7 1.8Z", "M8.6 5.2c-.4-.6-1-.9-1.7-.9-1 0-1.7.5-1.7 1.3 0 1.9 3.6.9 3.6 2.9 0 .8-.8 1.4-1.9 1.4-.8 0-1.5-.3-1.9-1M7 3.4v7.2"],
  ticket: ["M1.8 4.2h10.4v2a1 1 0 0 0 0 1.6v2H1.8v-2a1 1 0 0 0 0-1.6Z", "M8.6 4.2v5.6"],
  fuel: ["M3 12.2V2.8a1 1 0 0 1 1-1h3.6a1 1 0 0 1 1 1v9.4M2.2 12.2h7.2M3 6h5.6M8.6 5.2l2 1.6v3.6a.9.9 0 0 0 1.8 0V5.4L11 3.8"],
  shield: ["M7 1.8 2.8 3.4v3.4c0 2.6 1.8 4.6 4.2 5.4 2.4-.8 4.2-2.8 4.2-5.4V3.4Z"],
  health: ["M5.4 2.2h3.2v3.2h3.2v3.2H8.6v3.2H5.4V8.6H2.2V5.4h3.2Z"],
  customs: ["M1.8 6.2 7 2.2l5.2 4ZM3 6.2v6M11 6.2v6M1.8 12.2h10.4M5.8 12.2V9h2.4v3.2"],
  chat: ["M2.2 3.4a1.2 1.2 0 0 1 1.2-1.2h7.2a1.2 1.2 0 0 1 1.2 1.2v4.8a1.2 1.2 0 0 1-1.2 1.2H6l-2.6 2.2V9.4a1.2 1.2 0 0 1-1.2-1.2Z"],
  lock: ["M3 6.2h8v6H3Z", "M4.8 6.2V4.4a2.2 2.2 0 0 1 4.4 0v1.8"],
  food: ["M4 2v3.4a1.5 1.5 0 0 0 3 0V2M5.5 2v10M10.4 12.2V2c-1.4.8-2.2 2.6-2.2 5h2.2"],
  chevron: ["M4.2 5.6 7 8.4l2.8-2.8"],
  clock: ["M7 1.8a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 0 0 7 1.8Z", "M7 4.2V7l1.9 1.3"],
  external: ["M5 2.5h6.5V9M11.5 2.5 2.5 11.5"],
};

export function KnowGlyphIcon({ name, size = 13, className }: { name: KnowGlyphName; size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </LineIcon>
  );
}

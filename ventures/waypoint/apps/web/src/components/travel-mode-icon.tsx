/**
 * The travel-mode glyph set — the icon shown on the leg between two stops on
 * Route (ticket 78). Drawn here rather than pulled from an icon package: the
 * app has no icon dependency and the rest of its glyphs are hand-rolled paths
 * (see components/reaction-glyph.tsx), so a second style would show.
 *
 * `other` has no drawing on purpose. It is the transport type someone picks
 * when none of the four fit, so any picture would be a guess — the leg falls
 * back to its words, which it carries either way (colour, and here shape, is
 * never the only signal).
 *
 * No `"use client"`: paths only, so it composes into either kind of component.
 */
import type { TransportType } from "@/db/schema";

/** 14×14 viewBox, stroked not filled, to sit on a line of text like the rest. */
const PATHS: Partial<Record<TransportType, string[]>> = {
  flight: ["M1.5 8.2 12.5 3 9.9 9.2l-2.2.6-1.5 2.7-1-2.4-3.7-1.9Z"],
  train: [
    "M3.5 1.5h7a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1Z",
    "M2.5 5h9",
    "M4.5 12.5 6 9m4 3.5L8.5 9",
  ],
  car: [
    "M1.8 10.5V7.4l1.6-3.2a1 1 0 0 1 .9-.55h5.4a1 1 0 0 1 .9.55l1.6 3.2v3.1Z",
    "M1.8 7.4h10.4",
    "M4 10.5v1.3M10 10.5v1.3",
  ],
  ferry: [
    "M2.6 6.7 7 5.2l4.4 1.5-1.3 3.6H3.9Z",
    "M7 5.2V1.8",
    "M1.5 11.6c1.2 0 1.2 .9 2.4 .9s1.2-.9 2.4-.9 1.2 .9 2.4 .9 1.2-.9 2.4-.9",
  ],
};

export function TravelModeIcon({
  mode,
  size = 13,
}: {
  mode: TransportType;
  size?: number;
}) {
  const paths = PATHS[mode];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="shrink-0"
      style={{ width: size, height: size }}
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.15}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/**
 * Weather glyphs (ticket 148): one drawing per condition, drawn like
 * `travel-mode-icon.tsx` / `reaction-glyph.tsx` (14×14, currentColor, no emoji —
 * see visual-language "Iconography"). No `"use client"` — paths only, so it
 * composes into server or client rows.
 */
import type { WeatherCondition } from "@floc/core/weather";

const PATHS: Record<WeatherCondition, string[]> = {
  sun: [
    "M7 4.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z",
    "M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4",
    "M3 3l1 1M10 10l1 1M11 3l-1 1M4 10l-1 1",
  ],
  part: [
    "M5 3.4a1.8 1.8 0 1 0 1.5 2.8",
    "M5 1.2v1.1M2 3.6l.8.8M8 3.6l-.8.8",
    "M4.3 11.5h5.4a2.1 2.1 0 0 0 .2-4.2 3 3 0 0 0-5.7-.7 2.15 2.15 0 0 0 .1 4.9Z",
  ],
  cloud: [
    "M4.3 11h5.9a2.3 2.3 0 0 0 .2-4.6 3.3 3.3 0 0 0-6.3-.8 2.35 2.35 0 0 0 .2 5.4Z",
  ],
  rain: [
    "M4.3 9h5.9a2.3 2.3 0 0 0 .2-4.6 3.3 3.3 0 0 0-6.3-.8 2.35 2.35 0 0 0 .2 5.4Z",
    "M5 10.4l-.7 1.8M7 10.4l-.7 1.8M9 10.4l-.7 1.8",
  ],
};

export function WeatherGlyph({
  condition,
  size = 14,
}: {
  condition: WeatherCondition;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="shrink-0"
      style={{ width: size, height: size }}
    >
      {PATHS[condition].map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

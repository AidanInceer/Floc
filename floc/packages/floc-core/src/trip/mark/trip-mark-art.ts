/**
 * The geometry behind each trip mark (#318) — here rather than in either app
 * because both surfaces draw the same fifteen, and two copies drift.
 *
 * A 14x14 viewBox, `fill="none"`, `stroke="currentColor"`, strokeWidth ~1.2,
 * the house rule for every icon. Same shape as the faces in
 * `people/avatar-icon-art`, and `mountain` and `sun` ARE those entries rather
 * than a second copy of the same lines.
 */
import { AVATAR_ICON_ART, type IconArt } from "../../people/avatar-icon-art";
import type { TripMark } from "./trip-mark";

const WAVE_LINE = "M1.4 12.4c1.3 0 1.3-.8 2.6-.8s1.3.8 2.6.8 1.3-.8 2.6-.8 1.3.8 2.6.8";

export const TRIP_MARK_ART: Record<TripMark, IconArt> = {
  wave: {
    paths: [
      "M1.8 10.4C1.8 5.4 4.8 2.6 8.3 2.6c2.4 0 3.9 1.6 3.9 3.6 0 1.6-1.2 2.8-2.6 2.8-1.1 0-1.8-.7-1.8-1.6",
      "M1.9 12.1c1.3 0 1.3-.8 2.6-.8s1.3.8 2.6.8 1.3-.8 2.6-.8 1.3.8 2.4.8",
    ],
    circles: [],
  },
  mountain: AVATAR_ICON_ART.mountain,
  skyline: {
    paths: ["M1.4 12.4h11.2M2.6 12.4V7.2h2.8M5.4 12.4V3.6h3.2v8.8M8.6 6h2.8v6.4M7 3.6V1.6", "M6.6 6.2h.8M6.6 8.6h.8"],
    circles: [],
  },
  forest: {
    paths: [
      "M4.5 2 2 6h1.2L1.8 9h5.4L5.7 6H7L4.5 2ZM4.5 9v3",
      "M10 4 8.2 8h3.6L10 4ZM10 8v4",
    ],
    circles: [],
  },
  house: {
    paths: ["M2 7l5-4 5 4M3.5 6v6h7V6", "M6 12V9h2v3"],
    circles: [],
  },
  sun: AVATAR_ICON_ART.sun,
  campfire: {
    paths: [
      "M7 1.8c1.8 1.8 3 3.4 3 5.2A3 3 0 0 1 7 10a3 3 0 0 1-3-3c0-1.2.6-2 1.4-2.6 0 1 .4 1.6 1 1.8C6.2 4.6 6.4 3 7 1.8z",
      "M2.4 10.4l9.2 2.4M11.6 10.4l-9.2 2.4",
    ],
    circles: [],
  },
  camper: {
    paths: [
      "M3.4 10.2h-1V5.2c0-1 .8-1.8 1.8-1.8h5.6c1.4 0 2.2.8 2.6 2l.6 2.4v2.4h-.8M5.8 10.2h2.6",
      "M2.4 6.8h9.8M6 3.4v3.4M9 3.4v3.4",
    ],
    circles: [
      { cx: 4.6, cy: 10.4, r: 1.2 },
      { cx: 9.6, cy: 10.4, r: 1.2 },
    ],
  },
  island: {
    paths: [
      "M2 10.4c1.4-1.6 3-2.4 5-2.4s3.6.8 5 2.4",
      "M7.4 8.2c0-2-.4-3.4-1-4.6",
      "M6.4 3.6C5.4 2.6 4 2.6 3 3.4M6.4 3.6c.6-1.2 2-1.8 3.2-1.4M6.4 3.6c1.4-.2 2.6.6 3 1.8",
      WAVE_LINE,
    ],
    circles: [],
  },
  // Why: not the face's lighthouse — this one shines, which is what Aidan picked (2026-11-07).
  lighthouse: {
    paths: [
      "M5.4 5.4h3.2l1 7H4.4zM5.4 5.4V3.6h3.2v1.8M4.8 3.6 7 1.8l2.2 1.8M3.2 12.4h7.6M5 8.8h4",
      "M10.4 3.2l2.2-.8M10.4 4.8l2.2.8M3.6 3.2l-2.2-.8M3.6 4.8l-2.2.8",
    ],
    circles: [],
  },
  lolly: {
    paths: ["M4.4 8.8V4a2.6 2.6 0 0 1 5.2 0v4.8a.6.6 0 0 1-.6.6H5a.6.6 0 0 1-.6-.6zM7 9.4v3.2", "M6 4.2v3"],
    circles: [],
  },
  sunglasses: {
    paths: [
      "M1.4 5.6h4.4v2a2.2 2.2 0 0 1-4.4 0zM8.2 5.6h4.4v2a2.2 2.2 0 0 1-4.4 0zM5.8 6.2c.8-.5 1.6-.5 2.4 0",
      "M1.4 5.6 1 4.4M12.6 5.6l.4-1.2",
    ],
    circles: [],
  },
  flipflop: {
    paths: [
      "M7 1.8c2 0 3 1.6 3 3.8 0 1.8-.6 3-.6 4.6 0 1.2-1 2-2.4 2s-2.4-.8-2.4-2c0-1.6-.6-2.8-.6-4.6 0-2.2 1-3.8 3-3.8z",
      "M7 3.8 5 7.2M7 3.8l2 3.4",
    ],
    circles: [],
  },
  cocktail: {
    paths: ["M2.6 3.4h8.8L7 8zM7 8v4.2M4.8 12.2h4.4", "M8.6 1.2 7.8 4.6"],
    circles: [{ cx: 10.6, cy: 3.4, r: 1.3 }],
  },
  globe: {
    paths: ["M2 7h10M7 2c-1.6 1.4-2.4 3.2-2.4 5s.8 3.6 2.4 5M7 2c1.6 1.4 2.4 3.2 2.4 5s-.8 3.6-2.4 5"],
    circles: [{ cx: 7, cy: 7, r: 5 }],
  },
};

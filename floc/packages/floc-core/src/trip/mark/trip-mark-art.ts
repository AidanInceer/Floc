/**
 * The geometry behind each trip mark (#318) — here rather than in either app
 * because both surfaces draw the same ten, and two copies drift.
 *
 * A 14x14 viewBox, `fill="none"`, `stroke="currentColor"`, strokeWidth ~1.2,
 * the house rule for every icon. Same shape as the faces in
 * `people/avatar-icon-art`, and `mountain` and `sun` ARE those entries rather
 * than a second copy of the same lines.
 */
import { AVATAR_ICON_ART, type IconArt } from "../../people/avatar-icon-art";
import type { TripMark } from "./trip-mark";

export const TRIP_MARK_ART: Record<TripMark, IconArt> = {
  wave: {
    paths: [
      "M1.8 10.4C1.8 5.4 4.8 2.6 8.3 2.6c2.4 0 3.9 1.6 3.9 3.6 0 1.6-1.2 2.8-2.6 2.8-1.1 0-1.8-.7-1.8-1.6",
      "M1.9 12.1c1.3 0 1.3-.8 2.6-.8s1.3.8 2.6.8 1.3-.8 2.6-.8 1.3.8 2.4.8",
    ],
    circles: [],
  },
  mountain: AVATAR_ICON_ART.mountain,
  city: {
    paths: [
      "M2 12V6l3-1.5 3 1.5v6M8 12V4l3 1.5V12M2 12h10",
      "M4 7h1M4 9.5h1M9.5 7h.5M9.5 9.5h.5",
    ],
    circles: [],
  },
  tent: {
    paths: ["M2 11.5 7 3l5 8.5M2 11.5h10", "M5.8 11.5 7 8l1.2 3.5"],
    circles: [],
  },
  sun: AVATAR_ICON_ART.sun,
  house: {
    paths: ["M2 7l5-4 5 4M3.5 6v6h7V6", "M6 12V9h2v3"],
    circles: [],
  },
  forest: {
    paths: [
      "M4.5 2 2 6h1.2L1.8 9h5.4L5.7 6H7L4.5 2ZM4.5 9v3",
      "M10 4 8.2 8h3.6L10 4ZM10 8v4",
    ],
    circles: [],
  },
  umbrella: {
    paths: ["M7 3C4 3 2 5.5 2 6.5h10C12 5.5 10 3 7 3ZM7 3V1.5", "M7 6.5v4.5c0 .8-1.6.8-1.6-.2"],
    circles: [],
  },
  sail: {
    paths: ["M2.5 10h9l-1 2H3.5zM7 10V2.2L3.4 9.4z"],
    circles: [],
  },
  cruise: {
    paths: [
      "M1.4 8.6h11.2l-1.4 3.2H2.8zM3.2 8.6V5.4h7.4v3.2M5 5.4V3.6h2.2v1.8",
      "M4.4 6.9h.7M6.4 6.9h.7M8.4 6.9h.7",
    ],
    circles: [],
  },
};

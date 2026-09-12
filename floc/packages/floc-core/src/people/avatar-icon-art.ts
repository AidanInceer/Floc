/**
 * The geometry behind each face (#157) — here rather than in either app
 * because both surfaces draw the same seventeen, and two copies drift.
 *
 * A 14x14 viewBox, `fill="none"`, `stroke="currentColor"`, strokeWidth ~1.2,
 * the house rule for every icon. Each entry is the paths to stroke and the
 * circles to stroke; the surfaces supply the renderer, this supplies the hand.
 */
import type { AvatarIcon } from "./avatar-icon";

export type IconCircle = { cx: number; cy: number; r: number };
export type IconArt = { paths: readonly string[]; circles: readonly IconCircle[] };

export const AVATAR_ICON_ART: Record<AvatarIcon, IconArt> = {
  plane: {
    paths: [
      "M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z",
    ],
    circles: [],
  },
  compass: {
    paths: ["M9.2 4.8 8 8 4.8 9.2 6 6z"],
    circles: [{ cx: 7, cy: 7, r: 5 }],
  },
  camera: {
    paths: [
      "M1.8 4.6h2l.9-1.4h4.6l.9 1.4h2a.8.8 0 0 1 .8.8v5a.8.8 0 0 1-.8.8H1.8a.8.8 0 0 1-.8-.8v-5a.8.8 0 0 1 .8-.8z",
    ],
    circles: [{ cx: 7, cy: 7.8, r: 2 }],
  },
  map: {
    paths: ["M1.4 3.4 5 2l4 1.4L12.6 2v8.6L9 12 5 10.6 1.4 12zM5 2v8.6M9 3.4V12"],
    circles: [],
  },
  suitcase: {
    paths: [
      "M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8",
    ],
    circles: [],
  },
  mountain: { paths: ["M1 11.4 5.2 4l2.2 3.6L8.8 5.6l4.2 5.8zM4.2 5.8l2 1"], circles: [] },
  boat: {
    paths: ["M2 9.4h10l-1.4 2.4H3.4zM7 9.4V3.2M7 3.2l3.4 2.2L7 6.6M3.4 9.4V5.8"],
    circles: [],
  },
  passport: {
    paths: [
      "M3 1.8h8a.8.8 0 0 1 .8.8v8.8a.8.8 0 0 1-.8.8H3a.8.8 0 0 1-.8-.8V2.6a.8.8 0 0 1 .8-.8z",
      "M5 9.4h4",
    ],
    circles: [{ cx: 7, cy: 5.6, r: 1.6 }],
  },
  key: {
    paths: ["M6.2 6.2 11.6 11.6M9.6 9.6l1.2-1.2M10.8 10.8 12 9.6"],
    circles: [{ cx: 4.4, cy: 4.4, r: 2.6 }],
  },
  ticket: {
    paths: ["M1.4 4.4h11.2v2a1.2 1.2 0 0 0 0 3.2v.6H1.4V9.6a1.2 1.2 0 0 0 0-3.2zM8.4 4.4v5.8"],
    circles: [],
  },
  sun: {
    paths: [
      "M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4M3.1 3.1l1 1M9.9 9.9l1 1M10.9 3.1l-1 1M4.1 9.9l-1 1",
    ],
    circles: [{ cx: 7, cy: 7, r: 2.8 }],
  },
  backpack: {
    paths: [
      "M3 5.4a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v6.2H3zM5.4 2.4V1.6a.8.8 0 0 1 .8-.8h1.6a.8.8 0 0 1 .8.8v.8M5.2 7.4h3.6v2.2H5.2z",
    ],
    circles: [],
  },
  bicycle: {
    paths: ["M3.4 9.4 6 4.6h3M6 4.6l4.6 4.8M5.2 4.6h2"],
    circles: [
      { cx: 3.4, cy: 9.4, r: 2.4 },
      { cx: 10.6, cy: 9.4, r: 2.4 },
    ],
  },
  train: {
    paths: [
      "M3.4 2.2h7.2a1 1 0 0 1 1 1v6.4a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1V3.2a1 1 0 0 1 1-1zM2.4 6h9.2M4.4 10.6 3 12.6M9.6 10.6 11 12.6",
    ],
    circles: [],
  },
  balloon: {
    paths: [
      "M7 1.2c2.4 0 4.2 1.9 4.2 4.3 0 2.2-1.8 3.9-4.2 5.1C4.6 9.4 2.8 7.7 2.8 5.5 2.8 3.1 4.6 1.2 7 1.2zM5.6 10.9h2.8l-.4 1.9H6z",
    ],
    circles: [],
  },
  lighthouse: {
    paths: ["M5.4 5h3.2l1.2 7.2H3.2zM5.6 5V3.2h2.8V5M4.4 3.2h5.2M7 1.2v.8M4.6 8.4h4.8"],
    circles: [],
  },
  binoculars: {
    paths: ["M5.8 6.6 6.6 3h.8l.8 3.6M6 8.4h2"],
    circles: [
      { cx: 4, cy: 8.4, r: 2.6 },
      { cx: 10, cy: 8.4, r: 2.6 },
    ],
  },
};

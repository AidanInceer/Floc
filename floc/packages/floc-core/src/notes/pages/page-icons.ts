/**
 * The icon a notes page may wear (#408): travel objects plus the trip-link
 * kinds, in the app's own hand. Never emoji. Both surfaces draw from here.
 */
import type { IconArt } from "../../people/avatar-icon-art";

const art = (...paths: string[]): IconArt => ({ paths, circles: [] });

// Order is picker order: six travel objects, six marks, the six trip-link kinds.
export const PAGE_ICON_ART = {
  plane: art("M7 1.8c.6 0 .9.6.9 1.3v2.6l4.3 2.5v1.3L7.9 8.3v2.4l1.4 1v1L7 12.1l-2.3.6v-1l1.4-1V8.3L1.8 9.5V8.2l4.3-2.5V3.1c0-.7.3-1.3.9-1.3Z"),
  train: art("M5.2 1.8h3.6a2 2 0 0 1 2 2v4.4a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2V3.8a2 2 0 0 1 2-2Z", "M3.2 6.4h7.6M5.2 8.4h.01M8.8 8.4h.01M4.8 10.2 3.6 12.4M9.2 10.2l1.2 2.2"),
  car: art("M2.2 7.6 3.5 4.6a1 1 0 0 1 .9-.6h5.2a1 1 0 0 1 .9.6l1.3 3", "M2.8 7.4h8.4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Z", "M3.5 10.4v1.4M10.5 10.4v1.4"),
  bed: { paths: ["M1.8 3.6v8.2M1.8 9.2h10.4v2.6M12.2 9.2V7.8a1.6 1.6 0 0 0-1.6-1.6H6.2v3"], circles: [{ cx: 4, cy: 7.2, r: 1.1 }] },
  food: art("M3.6 1.8v3.8a1.3 1.3 0 0 0 2.6 0V1.8M4.9 1.8v10.4M10.2 12.2V1.8c-1.3.5-2 1.8-2 3.6v2.4h2"),
  camera: { paths: ["M3.1 4h7.8a1.3 1.3 0 0 1 1.3 1.3v5a1.3 1.3 0 0 1-1.3 1.3H3.1a1.3 1.3 0 0 1-1.3-1.3v-5A1.3 1.3 0 0 1 3.1 4Z", "m5 4 .8-1.6h2.4L9 4"], circles: [{ cx: 7, cy: 7.8, r: 2 }] },
  sun: { paths: ["M7 1.5v1.3M7 11.2v1.3M1.5 7h1.3M11.2 7h1.3M3.1 3.1l.9.9M10 10l.9.9M3.1 10.9l.9-.9M10 4l.9-.9"], circles: [{ cx: 7, cy: 7, r: 2.4 }] },
  map: art("M1.8 3.4 5 2.2l4 1.4 3.2-1.2v8.2L9 11.8l-4-1.4-3.2 1.2z", "M5 2.2v8.2M9 3.6v8.2"),
  ticket: art("M1.8 4.4h10.4v1.7a1.2 1.2 0 0 0 0 2.4v1.7H1.8V8.5a1.2 1.2 0 0 0 0-2.4z", "M8.6 4.8v.8M8.6 6.8v.8M8.6 8.8v.8"),
  star: art("m7 1.9 1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 10.1l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"),
  heart: art("M7 11.8S2 8.9 2 5.4a2.6 2.6 0 0 1 5-1.2 2.6 2.6 0 0 1 5 1.2c0 3.5-5 6.4-5 6.4Z"),
  list: art("M4.8 4h7M4.8 7h7M4.8 10h7M2.3 4h.01M2.3 7h.01M2.3 10h.01"),
  day: art("M3.4 2.8h7.2a1.4 1.4 0 0 1 1.4 1.4v6.2a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 10.4V4.2a1.4 1.4 0 0 1 1.4-1.4Z", "M2 5.8h10M4.8 1.6v2.2M9.2 1.6v2.2"),
  event: { paths: ["M7 4.4V7l1.8 1.2"], circles: [{ cx: 7, cy: 7, r: 4.8 }] },
  place: { paths: ["M7 12.4s3.8-3.6 3.8-6.6a3.8 3.8 0 1 0-7.6 0c0 3 3.8 6.6 3.8 6.6Z"], circles: [{ cx: 7, cy: 5.8, r: 1.3 }] },
  expense: art("M9.6 4.3c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.6 5.3 1.4 5.3 4.3 0 1.2-1.2 2.1-2.7 2.1-1.3 0-2.4-.6-2.8-1.6M7 1.3v11.4"),
  packing: art("M3.3 4.3h7.4a1.3 1.3 0 0 1 1.3 1.3v4.9a1.3 1.3 0 0 1-1.3 1.3H3.3A1.3 1.3 0 0 1 2 10.5V5.6a1.3 1.3 0 0 1 1.3-1.3Z", "M5 4.3V3a.8.8 0 0 1 .8-.8h2.4A.8.8 0 0 1 9 3v1.3M2 7.6h10"),
  file: art("M1.8 4a1 1 0 0 1 1-1h2.6l1.3 1.4h4.5a1 1 0 0 1 1 1v5.3a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z"),
} as const satisfies Record<string, IconArt>;

export type PageIcon = keyof typeof PAGE_ICON_ART;

export const PAGE_ICON_LABELS: Record<PageIcon, string> = {
  plane: "Plane",
  train: "Train",
  car: "Car",
  bed: "Bed",
  food: "Food",
  camera: "Camera",
  sun: "Sun",
  map: "Map",
  ticket: "Ticket",
  star: "Star",
  heart: "Heart",
  list: "List",
  day: "Day",
  event: "Event",
  place: "Place",
  expense: "Money",
  packing: "Packing",
  file: "File",
};

export const PAGE_ICONS = Object.keys(PAGE_ICON_ART) as readonly PageIcon[] as readonly [PageIcon, ...PageIcon[]];

// Why: null is the default, not a fallback — an icon dropped later degrades to no icon, never a hole.
export function readPageIcon(value: unknown): PageIcon | null {
  return typeof value === "string" && value in PAGE_ICON_ART ? (value as PageIcon) : null;
}

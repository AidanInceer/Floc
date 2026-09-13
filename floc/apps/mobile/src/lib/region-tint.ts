/**
 * One pastel family per region, named once (direction C).
 *
 * THE CHIP AND THE ROW MUST NOT DISAGREE. The filter chip is a promise about
 * what it will show you; if Europe is green while every European row is
 * periwinkle, the colour is decoration rather than a key. Both read this map,
 * so they cannot drift apart.
 *
 * The four families the design system already carries, plus the pen tint —
 * exhaustive by type, so a sixth region cannot be added without choosing its
 * colour here.
 */
import type { Region } from "@floc/core/trip/explore/preset-trips";

export type Tint = { fill: string; edge: string; ink: string };

export const REGION_TINT: Record<Region, Tint> = {
  Europe: { fill: "peri", edge: "peri-edge", ink: "peri-ink" },
  Africa: { fill: "butter", edge: "butter-edge", ink: "butter-ink" },
  Asia: { fill: "blush", edge: "blush-edge", ink: "blush-ink" },
  Americas: { fill: "mint", edge: "mint-edge", ink: "mint-ink" },
  Oceania: { fill: "pen-2", edge: "pen-edge", ink: "pen-deep" },
};

/**
 * "All" is not a region and must not borrow one's colour — a green All beside
 * a green Americas would read as the same filter twice. It goes darker rather
 * than coloured, which is the same "this one is chosen" signal without a claim.
 */
export const ALL_TINT: Tint = { fill: "sheet-3", edge: "rule-2", ink: "ink" };

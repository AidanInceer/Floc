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
import type { TokenName } from "@floc/core/design/tokens";

export type Tint = { fill: TokenName; edge: TokenName; ink: TokenName };

export const REGION_TINT: Record<Region, Tint> = {
  Europe: { fill: "pastel-blue", edge: "pastel-blue-edge", ink: "pastel-blue-ink" },
  Africa: { fill: "pastel-yellow", edge: "pastel-yellow-edge", ink: "pastel-yellow-ink" },
  Asia: { fill: "pastel-red", edge: "pastel-red-edge", ink: "pastel-red-ink" },
  Americas: { fill: "pastel-green", edge: "pastel-green-edge", ink: "pastel-green-ink" },
  Oceania: { fill: "pen-2", edge: "pen-edge", ink: "pen-deep" },
};

/**
 * "All" is not a region and must not borrow one's colour — a green All beside
 * a green Americas would read as the same filter twice. It goes darker rather
 * than coloured, which is the same "this one is chosen" signal without a claim.
 */
export const ALL_TINT: Tint = { fill: "sheet-3", edge: "rule-2", ink: "ink" };

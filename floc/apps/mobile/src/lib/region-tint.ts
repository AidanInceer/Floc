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

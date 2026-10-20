import type { Region } from "@floc/core/trip/explore/preset-trips";

export type RegionTone = {
  /** A filled mark: the number of a stop. */
  mark: string;
};

// One colour for a whole listing, the same family as its tag on /explore (`listing.ts`).
// Written out in full: Tailwind only keeps class names it can read in the source.
const TONES: Record<Region, RegionTone> = {
  Europe: {
    mark: "border-pastel-blue-edge bg-pastel-blue text-pastel-blue-ink",
  },
  Africa: {
    mark: "border-pastel-yellow-edge bg-pastel-yellow text-pastel-yellow-ink",
  },
  Asia: {
    mark: "border-pastel-red-edge bg-pastel-red text-pastel-red-ink",
  },
  Americas: {
    mark: "border-pastel-green-edge bg-pastel-green text-pastel-green-ink",
  },
  Oceania: {
    mark: "border-pen-edge bg-pen-soft text-pen-deep",
  },
};

export function regionTone(region: Region): RegionTone {
  return TONES[region];
}

import type { Region } from "@floc/core/trip/explore/preset-trips";

export type RegionTone = {
  /** A filled mark: a day button, the dot of the day on screen. */
  mark: string;
  edge: string;
  ink: string;
  /** The card of the day on screen. */
  now: string;
  ring: string;
  rail: string;
};

// One colour for a whole listing, the same family as its tag on /explore (`listing.ts`).
// Written out in full: Tailwind only keeps class names it can read in the source.
const TONES: Record<Region, RegionTone> = {
  Europe: {
    mark: "border-pastel-blue-edge bg-pastel-blue text-pastel-blue-ink",
    edge: "border-pastel-blue-edge",
    ink: "text-pastel-blue-ink",
    now: "border-pastel-blue-ink",
    ring: "ring-pastel-blue-ink",
    rail: "before:border-pastel-blue-edge",
  },
  Africa: {
    mark: "border-pastel-yellow-edge bg-pastel-yellow text-pastel-yellow-ink",
    edge: "border-pastel-yellow-edge",
    ink: "text-pastel-yellow-ink",
    now: "border-pastel-yellow-ink",
    ring: "ring-pastel-yellow-ink",
    rail: "before:border-pastel-yellow-edge",
  },
  Asia: {
    mark: "border-pastel-red-edge bg-pastel-red text-pastel-red-ink",
    edge: "border-pastel-red-edge",
    ink: "text-pastel-red-ink",
    now: "border-pastel-red-ink",
    ring: "ring-pastel-red-ink",
    rail: "before:border-pastel-red-edge",
  },
  Americas: {
    mark: "border-pastel-green-edge bg-pastel-green text-pastel-green-ink",
    edge: "border-pastel-green-edge",
    ink: "text-pastel-green-ink",
    now: "border-pastel-green-ink",
    ring: "ring-pastel-green-ink",
    rail: "before:border-pastel-green-edge",
  },
  Oceania: {
    mark: "border-pen-edge bg-pen-soft text-pen-deep",
    edge: "border-pen-edge",
    ink: "text-pen-deep",
    now: "border-pen-deep",
    ring: "ring-pen-deep",
    rail: "before:border-pen-edge",
  },
};

export function regionTone(region: Region): RegionTone {
  return TONES[region];
}

import type { Currency } from "../../money/currency";
import type { TransportType } from "../../vocabulary";
import type { Effort, Interest, Landscape } from "./finder/tag-groups";

type PresetLeg =
  | { kind: "base"; place: string; nights: number; lat: number; lng: number; country?: string }
  | { kind: "hop"; place: string; mode: TransportType; detail: string; lat?: number; lng?: number };

export type PresetTrip = {
  id: string;
  title: string;
  operator: string;
  editorial?: boolean;
  region: Region;
  country: string;
  nights: number;
  groupSize: string;
  priceFromMinor: number;
  currency: Currency;
  summary: string;
  legs: PresetLeg[];
  highlights: string[];
  bestMonths: string;
  interests: Interest[];
  landscape: Landscape[];
  effort: Effort;
};

export const REGIONS = [
  "Europe",
  "Africa",
  "Asia",
  "Americas",
  "Oceania",
] as const;

export type Region = (typeof REGIONS)[number];

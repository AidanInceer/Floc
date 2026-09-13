import type { Currency } from "../../money/currency";
import type { TransportType } from "../../vocabulary";

/**
 * Ticket 194: a listing is shown by its *shape* — where you sleep and how you
 * move between — rather than by a photograph. `base` nights always sum to
 * `nights`; a `hop` is the move in between and carries no nights of its own.
 *
 * Highlighted rows now plot the bases on a real map (`RouteMap`), so every
 * base carries its own `lat`/`lng`; a `hop` still carries none.
 */
type PresetLeg =
  | { kind: "base"; place: string; nights: number; lat: number; lng: number }
  | { kind: "hop"; place: string; mode: TransportType; detail: string };

export type PresetTrip = {
  id: string;
  title: string;
  /** Illustrative only — nothing is a partner. */
  operator: string;
  /** True for listings Floc would write itself rather than sell space for. */
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
};

export const REGIONS = [
  "Europe",
  "Africa",
  "Asia",
  "Americas",
  "Oceania",
] as const;

export type Region = (typeof REGIONS)[number];

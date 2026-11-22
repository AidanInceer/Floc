import type { Currency } from "../../../money/currency";
import type { Pace, StayStyle } from "../../../money/estimate/style";
import type { TransportType } from "../../../vocabulary";

export type PastSpend = { currency: Currency; minor: number };

export type PastTrip = {
  nights: number;
  countries: readonly string[];
  stops: number;
  moves: readonly TransportType[];
  spend: readonly PastSpend[];
};

export type TravelProfile = {
  vibes: readonly string[];
  stay: StayStyle | null;
  pace: Pace | null;
  saved: readonly string[];
  wantToGo: readonly string[];
  past: readonly PastTrip[];
};

export const NO_TRAVEL: TravelProfile = { vibes: [], stay: null, pace: null, saved: [], wantToGo: [], past: [] };

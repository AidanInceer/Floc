import type { Currency } from "../currency";
import type { Plan } from "./plan";
import type { TravelStyle } from "./style";
import type { Nights } from "./guide/trip-shape";

export type EstimateView = {
  currency: Currency;
  style: TravelStyle & { tripOnly: boolean };
  home: { code: string; name: string; inferred: boolean } | null;
  nights: Nights;
  places: boolean;
  plan: Plan;
};

export type EstimateSettings = { pro: boolean; homeAirport: string | null; inferred: string | null; style: TravelStyle };

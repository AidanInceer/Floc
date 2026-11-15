import type { Currency } from "../currency";
import type { Plan } from "./plan";
import type { TravelStyle } from "./style";
import type { Nights } from "./guide/trip-shape";

/** One member's estimate for one trip, all in their home currency (#574). The same shape on web and phone. */
export type EstimateView = {
  currency: Currency;
  style: TravelStyle & { tripOnly: boolean };
  home: { code: string; name: string; inferred: boolean } | null;
  nights: Nights;
  places: boolean;
  plan: Plan;
};

/** Your cost-estimate settings: Pro or not, your home airport or the one Floc suggests, your style. */
export type EstimateSettings = { pro: boolean; homeAirport: string | null; inferred: string | null; style: TravelStyle };

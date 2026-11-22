import type { EstimateLine } from "@floc/core/money/estimate/lines";
import type { Cabin, Pace, StayStyle, StyleChoice } from "@floc/core/money/estimate/style";
import type { TravelMode } from "@floc/core/money/estimate/travel";
import type { EstimateSettings, EstimateView } from "@floc/core/money/estimate/view";

export type { EstimateSettings, EstimateView } from "@floc/core/money/estimate/view";

export type EstimatePort = {
  loadEstimate(viewerId: string, tripId: number): Promise<{ pro: boolean; view: EstimateView | null }>;
  setEstimateBudget(viewerId: string, tripId: number, amountMinor: number | null): Promise<void>;
  setEstimateLine(viewerId: string, tripId: number, line: EstimateLine, patch: { figure?: number | null | undefined; budget?: number | null | undefined; notNeeded?: boolean | undefined }): Promise<void>;
  setEstimateTravel(viewerId: string, tripId: number, travel: TravelMode): Promise<void>;
  setEstimateStyle(viewerId: string, tripId: number, choice: StyleChoice | null): Promise<void>;
  setEstimateNights(viewerId: string, tripId: number, nights: number | null): Promise<void>;
  loadEstimateSettings(viewerId: string): Promise<EstimateSettings>;
  setEstimateSettings(
    viewerId: string,
    patch: { homeAirport?: string | null | undefined; cabin?: Cabin | undefined; stay?: StayStyle | undefined; pace?: Pace | undefined },
  ): Promise<void>;
};

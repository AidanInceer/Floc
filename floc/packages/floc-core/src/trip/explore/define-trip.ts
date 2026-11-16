import type { PresetTrip } from "./preset-trip-types";

export type TripDraft = Omit<PresetTrip, "nights">;

export function defineTrip(draft: TripDraft): PresetTrip {
  const nights = draft.legs.reduce((sum, leg) => (leg.kind === "base" ? sum + leg.nights : sum), 0);
  return { ...draft, nights };
}

import type { PresetTrip } from "./preset-trip-types";

/** A listing as written by hand. `nights` is left out: it is always the sum of the bases. */
export type TripDraft = Omit<PresetTrip, "nights">;

export function defineTrip(draft: TripDraft): PresetTrip {
  const nights = draft.legs.reduce((sum, leg) => (leg.kind === "base" ? sum + leg.nights : sum), 0);
  return { ...draft, nights };
}

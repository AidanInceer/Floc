// Why: Stripe owns the Pro prices (server/billing/billing.ts), so no code holds them to import.
// Change these the day the Stripe prices change.
export const QUOTED_PRICES = ["£0", "£3.99", "£29.99"] as const;

export const AMERICAN_SPELLINGS: Record<string, string> = {
  color: "colour",
  colors: "colours",
  favorite: "favourite",
  favorites: "favourites",
  organize: "organise",
  organized: "organised",
  organizing: "organising",
  organizer: "organiser",
  center: "centre",
  centered: "centred",
  traveling: "travelling",
  traveler: "traveller",
  travelers: "travellers",
  canceled: "cancelled",
  canceling: "cancelling",
  personalize: "personalise",
  personalized: "personalised",
  realize: "realise",
  prioritize: "prioritise",
  catalog: "catalogue",
};

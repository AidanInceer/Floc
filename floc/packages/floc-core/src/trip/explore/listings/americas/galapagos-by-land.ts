import { defineTrip } from "../../define-trip";

export const galapagosByLand = defineTrip({
  id: "galapagos-by-land",
  title: "Galápagos without a cruise",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Ecuador",
  groupSize: "2–8 people",
  priceFromMinor: 195000,
  currency: "USD",
  summary:
    "Land-based from Santa Cruz: giant tortoises in the highlands, a day boat to North Seymour, then the slow little town of Isabela.",
  legs: [
    { kind: "base", place: "Santa Cruz", nights: 3, lat: -0.743, lng: -90.313 },
    { kind: "hop", place: "Isabela", mode: "ferry", detail: "2h" },
    { kind: "base", place: "Isabela", nights: 2, lat: -0.956, lng: -90.966 },
  ],
  highlights: ["Tortoises at El Chato", "Blue-footed boobies on North Seymour", "Snorkelling Los Túneles"],
  bestMonths: "December to May",
  interests: ["Wildlife", "Beaches"],
  landscape: ["Coast"],
  effort: "Easy",
});

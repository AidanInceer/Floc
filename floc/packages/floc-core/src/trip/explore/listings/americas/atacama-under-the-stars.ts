import { defineTrip } from "../../define-trip";

export const atacamaUnderTheStars = defineTrip({
  id: "atacama-under-the-stars",
  title: "Atacama under the stars",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Chile",
  groupSize: "2–8 people",
  priceFromMinor: 135000,
  currency: "USD",
  summary:
    "One base, four big days: geysers at dawn, a float in a salt lagoon, sandboarding in Valle de la Luna, and the clearest night sky on earth.",
  legs: [
    { kind: "base", place: "San Pedro de Atacama", nights: 4, lat: -22.909, lng: -68.2 },
  ],
  highlights: ["El Tatio geysers at dawn", "Floating in Laguna Cejar", "A stargazing tour"],
  bestMonths: "March to May, September to November",
  interests: ["Hiking"],
  landscape: ["Desert", "Mountains"],
  effort: "Moderate",
});

import { defineTrip } from "../../define-trip";

export const medellinAndGuatape = defineTrip({
  id: "medellin-and-guatape",
  title: "Medellín and Guatapé",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Colombia",
  groupSize: "4–10 people",
  priceFromMinor: 54000,
  currency: "GBP",
  summary:
    "Comuna 13 by escalator, cable cars over the hills and salsa at night, then the 740 steps up El Peñol at Guatapé.",
  legs: [
    { kind: "base", place: "Medellín", nights: 3, lat: 6.244, lng: -75.581 },
    { kind: "hop", place: "Guatapé", mode: "other", detail: "bus 2h" },
    { kind: "base", place: "Guatapé", nights: 2, lat: 6.233, lng: -75.159 },
  ],
  highlights: ["Comuna 13's murals", "Climbing El Peñol", "A coffee farm visit"],
  bestMonths: "December to March, July, August",
  interests: ["Cities", "Food"],
  landscape: ["Mountains"],
  effort: "Easy",
});

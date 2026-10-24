import { defineTrip } from "../../define-trip";

export const djerbaAndTheSahara = defineTrip({
  id: "djerba-and-the-sahara",
  title: "Djerba and the Tunisian Sahara",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "Tunisia",
  groupSize: "4–10 people",
  priceFromMinor: 55000,
  currency: "EUR",
  summary:
    "Whitewashed Houmt Souk and the beaches of Djerba, then the ksour granaries and a night camped in the dunes at Douz.",
  legs: [
    { kind: "base", place: "Djerba", nights: 2, lat: 33.875, lng: 10.857 },
    { kind: "hop", place: "Douz", mode: "car", detail: "3h" },
    { kind: "base", place: "Douz", nights: 2, lat: 33.466, lng: 9.02 },
  ],
  highlights: ["The Ghriba synagogue", "A camel into the dunes", "Ksar Ouled Soltane"],
  bestMonths: "March to May, October, November",
  interests: ["History", "Beaches"],
  landscape: ["Desert", "Coast"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const fijiCoralCoast = defineTrip({
  id: "fiji-coral-coast",
  title: "Fiji's Coral Coast",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Fiji",
  groupSize: "4–12 people",
  priceFromMinor: 118000,
  currency: "USD",
  summary:
    "A village stay on the Coral Coast with the sand dunes at Sigatoka, then a boat out to the Mamanucas for the reef.",
  legs: [
    { kind: "base", place: "Coral Coast", nights: 3, lat: -18.2, lng: 177.7 },
    { kind: "hop", place: "Mamanuca islands", mode: "ferry", detail: "1h" },
    { kind: "base", place: "Mamanuca islands", nights: 2, lat: -17.67, lng: 177.1 },
  ],
  highlights: ["A lovo feast in a village", "Sigatoka sand dunes", "Snorkelling Cloud Nine"],
  bestMonths: "May to October",
  interests: ["Beaches", "Food"],
  landscape: ["Coast"],
  effort: "Easy",
});

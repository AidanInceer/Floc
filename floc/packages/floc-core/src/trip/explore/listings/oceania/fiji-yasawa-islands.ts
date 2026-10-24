import { defineTrip } from "../../define-trip";

export const fijiYasawaIslands = defineTrip({
  id: "fiji-yasawa-islands",
  title: "Fiji island hopping",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Fiji",
  groupSize: "2–8 people",
  priceFromMinor: 219000,
  currency: "GBP",
  summary:
    "Out by boat to the Mamanucas and up the Yasawa chain for four nights of reef and village, then back to the main island for the Coral Coast and the sharks of Beqa lagoon.",
  legs: [
    { kind: "base", place: "Nadi", nights: 1, lat: -17.776, lng: 177.435 },
    { kind: "hop", place: "Mamanuca islands", mode: "ferry", detail: "1h" },
    { kind: "base", place: "Mamanuca islands", nights: 2, lat: -17.677, lng: 177.098 },
    { kind: "hop", place: "Yasawa islands", mode: "ferry", detail: "3h" },
    { kind: "base", place: "Yasawa islands", nights: 4, lat: -16.889, lng: 177.425 },
    { kind: "hop", place: "Coral Coast", mode: "ferry", detail: "5h by boat and road" },
    { kind: "base", place: "Coral Coast", nights: 2, lat: -18.17, lng: 177.67 },
    { kind: "hop", place: "Pacific Harbour", mode: "car", detail: "1h 30" },
    { kind: "base", place: "Pacific Harbour", nights: 2, lat: -18.24, lng: 178.06 },
  ],
  highlights: ["Snorkelling with manta rays", "A lovo feast in a Yasawa village", "Shark dive in Beqa lagoon"],
  bestMonths: "May to October",
  interests: ["Beaches"],
  landscape: ["Coast"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const sydneyToCairns = defineTrip({
  id: "sydney-to-cairns",
  title: "Sydney to the reef",
  operator: "Flash Pack",
  region: "Oceania",
  country: "Australia",
  groupSize: "4–10 people",
  priceFromMinor: 325000,
  currency: "GBP",
  summary:
    "Sydney with a day in the Blue Mountains, surf at Byron Bay, Noosa and a 4x4 day on K'gari, a sail out to Whitehaven, then Cairns and the outer reef.",
  legs: [
    { kind: "base", place: "Sydney", nights: 3, lat: -33.869, lng: 151.209 },
    { kind: "hop", place: "Blue Mountains", mode: "train", detail: "day trip" },
    { kind: "hop", place: "Byron Bay", mode: "flight", detail: "1h 30" },
    { kind: "base", place: "Byron Bay", nights: 3, lat: -28.647, lng: 153.602 },
    { kind: "hop", place: "Noosa", mode: "car", detail: "3h 30" },
    { kind: "base", place: "Noosa", nights: 2, lat: -26.395, lng: 153.09 },
    { kind: "hop", place: "K'gari", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Airlie Beach", mode: "flight", detail: "1h 45" },
    { kind: "base", place: "Airlie Beach", nights: 3, lat: -20.268, lng: 148.718 },
    { kind: "hop", place: "Whitehaven Beach", mode: "ferry", detail: "day sail" },
    { kind: "hop", place: "Cairns", mode: "flight", detail: "1h 30" },
    { kind: "base", place: "Cairns", nights: 4, lat: -16.92, lng: 145.771 },
    { kind: "hop", place: "Great Barrier Reef", mode: "ferry", detail: "day trip" },
  ],
  highlights: ["Whitehaven Beach by boat", "Snorkelling the outer reef", "Sunrise at Cape Byron"],
  bestMonths: "April, May, September to November",
  interests: ["Beaches", "Cities", "Wildlife"],
  landscape: ["Coast", "Rainforest"],
  effort: "Easy",
});

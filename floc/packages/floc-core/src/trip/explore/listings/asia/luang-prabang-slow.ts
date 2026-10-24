import { defineTrip } from "../../define-trip";

export const luangPrabangSlow = defineTrip({
  id: "luang-prabang-slow",
  title: "Luang Prabang, slowly",
  operator: "Intrepid Travel",
  region: "Asia",
  country: "Laos",
  groupSize: "2–8 people",
  priceFromMinor: 52000,
  currency: "GBP",
  summary:
    "Monks at dawn, the night market, the blue pools of Kuang Si, then the fast train south to the karsts of Vang Vieng.",
  legs: [
    { kind: "base", place: "Luang Prabang", nights: 3, lat: 19.886, lng: 102.135 },
    { kind: "hop", place: "Vang Vieng", mode: "train", detail: "1h" },
    { kind: "base", place: "Vang Vieng", nights: 2, lat: 18.922, lng: 102.447 },
  ],
  highlights: ["The morning alms round", "Swimming at Kuang Si", "Tubing the Nam Song"],
  bestMonths: "November to March",
  interests: ["History", "Hiking"],
  landscape: ["Mountains", "Rainforest"],
  effort: "Easy",
});

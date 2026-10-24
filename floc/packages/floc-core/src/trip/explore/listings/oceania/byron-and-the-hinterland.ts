import { defineTrip } from "../../define-trip";

export const byronAndTheHinterland = defineTrip({
  id: "byron-and-the-hinterland",
  title: "Byron Bay and the hinterland",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Australia",
  groupSize: "4–10 people",
  priceFromMinor: 115000,
  currency: "AUD",
  summary:
    "Surf lessons and the lighthouse walk in Byron, then a farmhouse in the rainforest hinterland near Bangalow.",
  legs: [
    { kind: "base", place: "Byron Bay", nights: 3, lat: -28.647, lng: 153.602 },
    { kind: "hop", place: "Bangalow", mode: "car", detail: "20m" },
    { kind: "base", place: "Bangalow", nights: 2, lat: -28.687, lng: 153.524 },
  ],
  highlights: ["Cape Byron at sunrise", "A surf lesson at The Pass", "Minyon falls"],
  bestMonths: "September to May",
  interests: ["Beaches", "Food"],
  landscape: ["Coast", "Rainforest"],
  effort: "Easy",
});

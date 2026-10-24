import { defineTrip } from "../../define-trip";

export const okavangoDeltaShort = defineTrip({
  id: "okavango-delta-short",
  title: "Into the Okavango",
  operator: "Wilderness Travel",
  region: "Africa",
  country: "Botswana",
  groupSize: "2–6 people",
  priceFromMinor: 285000,
  currency: "USD",
  summary:
    "A small plane from Maun to a delta camp: mokoro canoes through the reeds, walks with a guide, and elephants at the water hole.",
  legs: [
    { kind: "base", place: "Maun", nights: 1, lat: -19.983, lng: 23.416 },
    { kind: "hop", place: "Okavango delta", mode: "flight", detail: "light aircraft 40m" },
    { kind: "base", place: "Okavango delta", nights: 3, lat: -19.3, lng: 22.9 },
  ],
  highlights: ["A mokoro at dawn", "A bush walk on foot", "The flight over the delta"],
  bestMonths: "June to October",
  interests: ["Wildlife"],
  landscape: ["Savannah"],
  effort: "Easy",
});

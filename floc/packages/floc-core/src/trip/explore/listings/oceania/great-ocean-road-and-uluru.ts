import { defineTrip } from "../../define-trip";

export const greatOceanRoadAndUluru = defineTrip({
  id: "great-ocean-road-and-uluru",
  title: "Great Ocean Road to Uluru",
  operator: "Intrepid Travel",
  region: "Oceania",
  country: "Australia",
  groupSize: "4–12 people",
  priceFromMinor: 245000,
  currency: "GBP",
  summary:
    "Melbourne's lanes, the Great Ocean Road to the Twelve Apostles, walks in the Grampians, Adelaide with a day in the Barossa, then a flight to the red centre.",
  legs: [
    { kind: "base", place: "Melbourne", nights: 3, lat: -37.814, lng: 144.963 },
    { kind: "hop", place: "Lorne", mode: "car", detail: "2h 15" },
    { kind: "base", place: "Lorne", nights: 1, lat: -38.541, lng: 143.976 },
    { kind: "hop", place: "Port Campbell", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Port Campbell", nights: 1, lat: -38.619, lng: 142.996 },
    { kind: "hop", place: "Grampians", mode: "car", detail: "3h" },
    { kind: "base", place: "Grampians", nights: 2, lat: -37.14, lng: 142.52 },
    { kind: "hop", place: "Adelaide", mode: "car", detail: "5h" },
    { kind: "base", place: "Adelaide", nights: 2, lat: -34.929, lng: 138.601 },
    { kind: "hop", place: "Barossa", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Uluru", mode: "flight", detail: "2h" },
    { kind: "base", place: "Uluru", nights: 3, lat: -25.344, lng: 131.036 },
  ],
  highlights: ["The Twelve Apostles at sunset", "Barossa cellar doors", "Uluru at first light"],
  bestMonths: "March to May, September to November",
  interests: ["Food", "Hiking"],
  landscape: ["Coast", "Desert"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const scottishHighlandsAndSkye = defineTrip({
  id: "scottish-highlands-and-skye",
  title: "Highlands and Skye",
  operator: "Floc editorial",
  editorial: true,
  region: "Europe",
  country: "Scotland",
  groupSize: "4–8 people",
  priceFromMinor: 129000,
  currency: "GBP",
  summary:
    "Edinburgh, then a hire car north: Glencoe, three nights on Skye, a cottage at Torridon with the pass to Applecross, and Inverness to finish.",
  legs: [
    { kind: "base", place: "Edinburgh", nights: 2, lat: 55.953, lng: -3.188 },
    { kind: "hop", place: "Glencoe", mode: "car", detail: "3h" },
    { kind: "base", place: "Glencoe", nights: 2, lat: 56.682, lng: -5.102 },
    { kind: "hop", place: "Isle of Skye", mode: "car", detail: "3h" },
    { kind: "base", place: "Isle of Skye", nights: 3, lat: 57.413, lng: -6.196 },
    { kind: "hop", place: "Torridon", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Torridon", nights: 2, lat: 57.546, lng: -5.512 },
    { kind: "hop", place: "Applecross", mode: "car", detail: "day drive" },
    { kind: "hop", place: "Inverness", mode: "car", detail: "2h" },
    { kind: "base", place: "Inverness", nights: 1, lat: 57.478, lng: -4.224 },
  ],
  highlights: ["Glencoe's three sisters", "The Old Man of Storr", "Applecross by the Bealach na Bà"],
  bestMonths: "May, June, September",
  interests: ["Hiking"],
  landscape: ["Mountains", "Coast"],
  effort: "Moderate",
});

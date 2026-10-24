import { defineTrip } from "../../define-trip";

export const marrakechAndToubkal = defineTrip({
  id: "marrakech-and-toubkal",
  title: "Marrakech and Toubkal",
  operator: "Much Better Adventures",
  region: "Africa",
  country: "Morocco",
  groupSize: "4–12 people",
  priceFromMinor: 59000,
  currency: "GBP",
  summary:
    "A night in Imlil, then a two-day climb to the top of North Africa with mules for the bags, and two nights in the medina to finish.",
  legs: [
    { kind: "base", place: "Imlil", nights: 1, lat: 31.137, lng: -7.92 },
    { kind: "hop", place: "Toubkal refuge", mode: "other", detail: "walk 5h" },
    { kind: "base", place: "Toubkal refuge", nights: 1, lat: 31.062, lng: -7.915 },
    { kind: "hop", place: "Marrakech", mode: "car", detail: "walk down, then 1h 30" },
    { kind: "base", place: "Marrakech", nights: 2, lat: 31.629, lng: -7.981 },
  ],
  highlights: ["Summit of Jebel Toubkal", "Tagine in a Berber house", "Jemaa el-Fnaa after dark"],
  bestMonths: "April to October",
  interests: ["Hiking"],
  landscape: ["Mountains"],
  effort: "Tough",
});

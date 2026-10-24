import { defineTrip } from "../../define-trip";

export const queenstownAndWanaka = defineTrip({
  id: "queenstown-and-wanaka",
  title: "Queenstown and Wānaka",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "New Zealand",
  groupSize: "4–10 people",
  priceFromMinor: 135000,
  currency: "NZD",
  summary:
    "The gondola and a jet boat in Queenstown, then the Crown Range to Wānaka and Roys Peak for the view everyone has seen.",
  legs: [
    { kind: "base", place: "Queenstown", nights: 3, lat: -45.031, lng: 168.663 },
    { kind: "hop", place: "Wānaka", mode: "car", detail: "Crown Range, 1h" },
    { kind: "base", place: "Wānaka", nights: 2, lat: -44.7, lng: 169.132 },
  ],
  highlights: ["The Shotover jet", "Roys Peak", "Wine in the Gibbston valley"],
  bestMonths: "December to March",
  interests: ["Hiking", "Food"],
  landscape: ["Mountains"],
  effort: "Moderate",
});

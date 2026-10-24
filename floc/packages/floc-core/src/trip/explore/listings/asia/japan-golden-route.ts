import { defineTrip } from "../../define-trip";

export const japanGoldenRoute = defineTrip({
  id: "japan-golden-route",
  title: "Tokyo to Osaka",
  operator: "Inside Japan Tours",
  region: "Asia",
  country: "Japan",
  groupSize: "2–6 people",
  priceFromMinor: 265000,
  currency: "GBP",
  summary:
    "Tokyo, a ryokan night in Hakone, four nights in Kyoto with Nara on the side, Hiroshima and Miyajima, then Osaka to eat. All on a rail pass, with two empty afternoons.",
  legs: [
    { kind: "base", place: "Tokyo", nights: 4, lat: 35.676, lng: 139.65 },
    { kind: "hop", place: "Hakone", mode: "train", detail: "1h 30" },
    { kind: "base", place: "Hakone", nights: 1, lat: 35.233, lng: 139.107 },
    { kind: "hop", place: "Kyoto", mode: "train", detail: "2h 20" },
    { kind: "base", place: "Kyoto", nights: 4, lat: 35.011, lng: 135.768 },
    { kind: "hop", place: "Nara", mode: "train", detail: "day trip" },
    { kind: "hop", place: "Hiroshima", mode: "train", detail: "1h 40" },
    { kind: "base", place: "Hiroshima", nights: 2, lat: 34.385, lng: 132.455 },
    { kind: "hop", place: "Miyajima", mode: "ferry", detail: "day trip" },
    { kind: "hop", place: "Osaka", mode: "train", detail: "1h 30" },
    { kind: "base", place: "Osaka", nights: 2, lat: 34.694, lng: 135.502 },
  ],
  highlights: ["Shinkansen to Kyoto", "A night in a Hakone ryokan", "Miyajima's gate at high tide"],
  bestMonths: "March to May, October, November",
  interests: ["Food", "Cities", "History"],
  landscape: ["Mountains"],
  effort: "Easy",
});

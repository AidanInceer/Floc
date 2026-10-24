import { defineTrip } from "../../define-trip";

export const tbilisiAndKazbegi = defineTrip({
  id: "tbilisi-and-kazbegi",
  title: "Tbilisi and the Caucasus",
  operator: "G Adventures",
  region: "Europe",
  country: "Georgia",
  groupSize: "4–12 people",
  priceFromMinor: 61000,
  currency: "GBP",
  summary:
    "Sulphur baths and supra feasts in Tbilisi, then up the Georgian Military Road to Kazbegi and the church on the hill under Mount Kazbek.",
  legs: [
    { kind: "base", place: "Tbilisi", nights: 3, lat: 41.716, lng: 44.783 },
    { kind: "hop", place: "Kazbegi", mode: "car", detail: "3h" },
    { kind: "base", place: "Kazbegi", nights: 2, lat: 42.657, lng: 44.643 },
  ],
  highlights: ["A supra with toasts", "Gergeti Trinity church at dawn", "Wine from the clay qvevri"],
  bestMonths: "May to October",
  interests: ["Food", "Hiking"],
  landscape: ["Mountains"],
  effort: "Moderate",
});

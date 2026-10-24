import { defineTrip } from "../../define-trip";

export const antiguaAndAtitlan = defineTrip({
  id: "antigua-and-atitlan",
  title: "Antigua and Lake Atitlán",
  operator: "G Adventures",
  region: "Americas",
  country: "Guatemala",
  groupSize: "4–12 people",
  priceFromMinor: 62000,
  currency: "USD",
  summary:
    "Cobbled Antigua and a night hike up Acatenango to watch Fuego erupt, then boats between the villages of Lake Atitlán.",
  legs: [
    { kind: "base", place: "Antigua", nights: 3, lat: 14.557, lng: -90.733 },
    { kind: "hop", place: "Lake Atitlán", mode: "car", detail: "3h" },
    { kind: "base", place: "Lake Atitlán", nights: 3, lat: 14.7, lng: -91.2 },
  ],
  highlights: ["Fuego erupting from Acatenango", "A lancha between villages", "Weaving in San Juan"],
  bestMonths: "November to April",
  interests: ["Hiking", "History"],
  landscape: ["Mountains"],
  effort: "Tough",
});

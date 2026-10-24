import { defineTrip } from "../../define-trip";

export const mexicoYucatanLoop = defineTrip({
  id: "mexico-yucatan-loop",
  title: "Yucatán cenotes and ruins",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Mexico",
  groupSize: "4–8 people",
  priceFromMinor: 129000,
  currency: "GBP",
  summary:
    "Tulum's beach, a cenote a day, Chichén Itzá from Valladolid, Mérida for the food, then the lagoon at Bacalar. One hire car, short drives.",
  legs: [
    { kind: "base", place: "Tulum", nights: 3, lat: 20.211, lng: -87.465 },
    { kind: "hop", place: "Valladolid", mode: "car", detail: "2h" },
    { kind: "base", place: "Valladolid", nights: 2, lat: 20.689, lng: -88.201 },
    { kind: "hop", place: "Chichén Itzá", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Mérida", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Mérida", nights: 3, lat: 20.967, lng: -89.623 },
    { kind: "hop", place: "Bacalar", mode: "car", detail: "5h" },
    { kind: "base", place: "Bacalar", nights: 2, lat: 18.677, lng: -88.395 },
  ],
  highlights: ["Chichén Itzá at opening", "Swimming in cenotes", "The lagoon of seven colours"],
  bestMonths: "December to April",
  interests: ["History", "Beaches"],
  landscape: ["Coast", "Rainforest"],
  effort: "Easy",
});

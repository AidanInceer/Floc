import { defineTrip } from "../../define-trip";

export const salarDeUyuni = defineTrip({
  id: "salar-de-uyuni",
  title: "Across the Salar de Uyuni",
  operator: "G Adventures",
  region: "Americas",
  country: "Bolivia",
  groupSize: "4–8 people",
  priceFromMinor: 72000,
  currency: "USD",
  summary:
    "Three days by 4x4 across the salt flat and the high lagoons: flamingos, red water, geysers and a night in a hotel built of salt.",
  legs: [
    { kind: "base", place: "Uyuni", nights: 1, lat: -20.46, lng: -66.825 },
    { kind: "hop", place: "Salt hotel", mode: "car", detail: "4x4" },
    { kind: "base", place: "Salt hotel", nights: 1, lat: -20.25, lng: -67.5 },
    { kind: "hop", place: "Laguna Colorada", mode: "car", detail: "4x4, 6h" },
    { kind: "base", place: "Laguna Colorada", nights: 2, lat: -22.2, lng: -67.78 },
  ],
  highlights: ["The salt flat at sunrise", "Flamingos on Laguna Colorada", "Hot springs at 4,400 metres"],
  bestMonths: "April to October",
  interests: ["Wildlife"],
  landscape: ["Desert", "Mountains"],
  effort: "Tough",
});

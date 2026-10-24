import { defineTrip } from "../../define-trip";

export const dakarAndSaloum = defineTrip({
  id: "dakar-and-saloum",
  title: "Dakar and the Saloum delta",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "Senegal",
  groupSize: "4–8 people",
  priceFromMinor: 74000,
  currency: "EUR",
  summary:
    "Live mbalax in Dakar and the boat to Gorée, then a pirogue through the mangroves of the Sine-Saloum and nights in an ecolodge.",
  legs: [
    { kind: "base", place: "Dakar", nights: 2, lat: 14.716, lng: -17.467 },
    { kind: "hop", place: "Saloum delta", mode: "car", detail: "3h" },
    { kind: "base", place: "Saloum delta", nights: 3, lat: 13.85, lng: -16.6 },
  ],
  highlights: ["Gorée island", "Pirogue through the mangroves", "Thieboudienne at a family table"],
  bestMonths: "November to May",
  interests: ["Food", "History", "Wildlife"],
  landscape: ["Coast"],
  effort: "Easy",
});

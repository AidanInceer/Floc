import { defineTrip } from "../../define-trip";

export const ubudAndNusaPenida = defineTrip({
  id: "ubud-and-nusa-penida",
  title: "Ubud and Nusa Penida",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "Indonesia",
  groupSize: "2–10 people",
  priceFromMinor: 64000,
  currency: "GBP",
  summary:
    "Rice terraces, a cooking class and the water temple in Ubud, then a fast boat to Nusa Penida's cliffs and the manta rays.",
  legs: [
    { kind: "base", place: "Ubud", nights: 3, lat: -8.507, lng: 115.263 },
    { kind: "hop", place: "Nusa Penida", mode: "ferry", detail: "45m" },
    { kind: "base", place: "Nusa Penida", nights: 2, lat: -8.727, lng: 115.544 },
  ],
  highlights: ["Tegallalang at seven", "Snorkelling with mantas", "Kelingking beach from the top"],
  bestMonths: "April to October",
  interests: ["Food", "Beaches", "Wildlife"],
  landscape: ["Rainforest", "Coast"],
  effort: "Moderate",
});

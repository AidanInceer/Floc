import { defineTrip } from "../../define-trip";

export const portoToSeville = defineTrip({
  id: "porto-to-seville",
  title: "Porto to Seville",
  operator: "TUI",
  region: "Europe",
  country: "Portugal, Spain",
  groupSize: "4–8 people",
  priceFromMinor: 132000,
  currency: "EUR",
  summary:
    "Port lodges and the Douro, trams and Sintra from Lisbon, a night inside Évora's walls, three beach days in the Algarve, then over the border to Seville.",
  legs: [
    { kind: "base", place: "Porto", nights: 2, lat: 41.158, lng: -8.629, country: "PT" },
    { kind: "hop", place: "Douro valley", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Lisbon", mode: "train", detail: "3h" },
    { kind: "base", place: "Lisbon", nights: 3, lat: 38.722, lng: -9.139, country: "PT" },
    { kind: "hop", place: "Sintra", mode: "train", detail: "day trip" },
    { kind: "hop", place: "Évora", mode: "car", detail: "1h 30" },
    { kind: "base", place: "Évora", nights: 1, lat: 38.571, lng: -7.909, country: "PT" },
    { kind: "hop", place: "Lagos", mode: "car", detail: "3h" },
    { kind: "base", place: "Lagos", nights: 3, lat: 37.102, lng: -8.673, country: "PT" },
    { kind: "hop", place: "Seville", mode: "car", detail: "3h 30" },
    { kind: "base", place: "Seville", nights: 3, lat: 37.389, lng: -5.984, country: "ES" },
  ],
  highlights: ["Port lodges and the Douro", "Sintra's palaces", "A tapas crawl in Triana"],
  bestMonths: "April to June, September, October",
  interests: ["Food", "Cities"],
  landscape: ["Countryside"],
  effort: "Easy",
});

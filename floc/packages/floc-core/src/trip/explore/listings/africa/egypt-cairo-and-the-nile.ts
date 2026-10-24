import { defineTrip } from "../../define-trip";

export const egyptCairoAndTheNile = defineTrip({
  id: "egypt-cairo-and-the-nile",
  title: "Cairo and the Nile",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "Egypt",
  groupSize: "4–12 people",
  priceFromMinor: 145000,
  currency: "GBP",
  summary:
    "The pyramids and the old city first, then a boat up the Nile from Luxor past Edfu to Aswan, with a temple most mornings and Abu Simbel at dawn.",
  legs: [
    { kind: "base", place: "Cairo", nights: 3, lat: 30.044, lng: 31.236 },
    { kind: "hop", place: "Luxor", mode: "flight", detail: "1h" },
    { kind: "base", place: "Luxor", nights: 2, lat: 25.687, lng: 32.639 },
    { kind: "hop", place: "Edfu", mode: "ferry", detail: "a day on the river" },
    { kind: "base", place: "Edfu", nights: 2, lat: 24.978, lng: 32.873 },
    { kind: "hop", place: "Aswan", mode: "ferry", detail: "a day on the river" },
    { kind: "base", place: "Aswan", nights: 3, lat: 24.089, lng: 32.899 },
    { kind: "hop", place: "Abu Simbel", mode: "car", detail: "day trip" },
  ],
  highlights: ["Giza before the crowds", "The Valley of the Kings", "Abu Simbel at dawn"],
  bestMonths: "October to April",
  interests: ["History"],
  landscape: ["Desert"],
  effort: "Easy",
});

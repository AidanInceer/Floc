import { defineTrip } from "../../define-trip";

export const patagoniaWTrek = defineTrip({
  id: "patagonia-w-trek",
  title: "Patagonia, both sides",
  operator: "Exodus Adventure Travels",
  region: "Americas",
  country: "Argentina, Chile",
  groupSize: "6–12 people",
  priceFromMinor: 289000,
  currency: "GBP",
  summary:
    "The Perito Moreno glacier, three days of walking under Fitz Roy, then over the border for the W trek in Torres del Paine, refugio to refugio.",
  legs: [
    { kind: "base", place: "El Calafate", nights: 2, lat: -50.338, lng: -72.264, country: "AR" },
    { kind: "hop", place: "Perito Moreno", mode: "car", detail: "day trip" },
    { kind: "hop", place: "El Chaltén", mode: "car", detail: "3h" },
    { kind: "base", place: "El Chaltén", nights: 3, lat: -49.331, lng: -72.886, country: "AR" },
    { kind: "hop", place: "Puerto Natales", mode: "car", detail: "8h by bus" },
    { kind: "base", place: "Puerto Natales", nights: 1, lat: -51.729, lng: -72.507, country: "CL" },
    { kind: "hop", place: "Torres del Paine", mode: "car", detail: "2h" },
    { kind: "base", place: "Refugios on the W", nights: 4, lat: -50.999, lng: -72.986, country: "CL" },
    { kind: "hop", place: "Puerto Natales", mode: "ferry", detail: "3h by boat and bus" },
    { kind: "base", place: "Puerto Natales", nights: 2, lat: -51.729, lng: -72.507, country: "CL" },
  ],
  highlights: ["The Perito Moreno glacier", "Laguna de los Tres under Fitz Roy", "The W trek, refugio to refugio"],
  bestMonths: "November to March",
  interests: ["Hiking"],
  landscape: ["Mountains"],
  effort: "Tough",
});

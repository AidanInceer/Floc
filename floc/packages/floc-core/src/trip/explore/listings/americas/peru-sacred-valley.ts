import { defineTrip } from "../../define-trip";

export const peruSacredValley = defineTrip({
  id: "peru-sacred-valley",
  title: "Lima, Machu Picchu and Titicaca",
  operator: "G Adventures",
  region: "Americas",
  country: "Peru",
  groupSize: "4–12 people",
  priceFromMinor: 179000,
  currency: "GBP",
  summary:
    "Ceviche in Lima, a slow start in Cusco for the height, markets in the Sacred Valley, the train to Machu Picchu, then the bus over the altiplano to the reed islands of Titicaca.",
  legs: [
    { kind: "base", place: "Lima", nights: 2, lat: -12.046, lng: -77.043 },
    { kind: "hop", place: "Cusco", mode: "flight", detail: "1h 20" },
    { kind: "base", place: "Cusco", nights: 2, lat: -13.532, lng: -71.968 },
    { kind: "hop", place: "Sacred Valley", mode: "car", detail: "1h 30" },
    { kind: "base", place: "Sacred Valley", nights: 2, lat: -13.33, lng: -72.083 },
    { kind: "hop", place: "Aguas Calientes", mode: "train", detail: "1h 45" },
    { kind: "base", place: "Aguas Calientes", nights: 1, lat: -13.155, lng: -72.525 },
    { kind: "hop", place: "Machu Picchu", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Cusco", mode: "train", detail: "3h 30" },
    { kind: "base", place: "Cusco", nights: 2, lat: -13.532, lng: -71.968 },
    { kind: "hop", place: "Puno", mode: "car", detail: "7h by bus" },
    { kind: "base", place: "Puno", nights: 2, lat: -15.84, lng: -70.022 },
  ],
  highlights: ["Machu Picchu at opening", "Markets of the Sacred Valley", "The reed islands of Titicaca"],
  bestMonths: "April to October",
  interests: ["History", "Hiking"],
  landscape: ["Mountains"],
  effort: "Tough",
});

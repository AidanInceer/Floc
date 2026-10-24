import { defineTrip } from "../../define-trip";

export const lalibelaAndSimien = defineTrip({
  id: "lalibela-and-simien",
  title: "Lalibela and the Simien mountains",
  operator: "Wild Frontiers",
  region: "Africa",
  country: "Ethiopia",
  groupSize: "4–10 people",
  priceFromMinor: 135000,
  currency: "GBP",
  summary:
    "The rock-hewn churches of Lalibela, then the Simiens for gelada monkeys on the cliff edge and a camp at 3,600 metres.",
  legs: [
    { kind: "base", place: "Lalibela", nights: 2, lat: 12.032, lng: 39.047 },
    { kind: "hop", place: "Simien mountains", mode: "flight", detail: "via Gondar, then 3h" },
    { kind: "base", place: "Simien mountains", nights: 3, lat: 13.183, lng: 38.067 },
  ],
  highlights: ["Bete Giyorgis from above", "Gelada troops at Chennek", "Coffee ceremony in a village"],
  bestMonths: "October to March",
  interests: ["History", "Hiking", "Wildlife"],
  landscape: ["Mountains"],
  effort: "Tough",
});

import { defineTrip } from "../../define-trip";

export const petraAndWadiRum = defineTrip({
  id: "petra-and-wadi-rum",
  title: "Petra and a night in Wadi Rum",
  operator: "Intrepid Travel",
  region: "Asia",
  country: "Jordan",
  groupSize: "4–12 people",
  priceFromMinor: 84000,
  currency: "GBP",
  summary:
    "Two days in Petra with the Monastery and Petra by Night, then a jeep into Wadi Rum to sleep in a camp under a great many stars.",
  legs: [
    { kind: "base", place: "Petra", nights: 2, lat: 30.329, lng: 35.444 },
    { kind: "hop", place: "Wadi Rum", mode: "car", detail: "1h 30" },
    { kind: "base", place: "Wadi Rum", nights: 1, lat: 29.575, lng: 35.42 },
    { kind: "hop", place: "Aqaba", mode: "car", detail: "1h" },
    { kind: "base", place: "Aqaba", nights: 1, lat: 29.532, lng: 35.006 },
  ],
  highlights: ["The Monastery climb", "A night in a Bedouin camp", "Snorkelling the Red Sea"],
  bestMonths: "March to May, September to November",
  interests: ["History", "Hiking"],
  landscape: ["Desert"],
  effort: "Moderate",
});

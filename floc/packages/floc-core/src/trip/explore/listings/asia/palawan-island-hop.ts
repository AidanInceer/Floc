import { defineTrip } from "../../define-trip";

export const palawanIslandHop = defineTrip({
  id: "palawan-island-hop",
  title: "El Nido to Coron",
  operator: "G Adventures",
  region: "Asia",
  country: "Philippines",
  groupSize: "4–12 people",
  priceFromMinor: 74000,
  currency: "GBP",
  summary:
    "A boat a day around El Nido's lagoons, then a bangka to Coron for wreck snorkelling and Kayangan lake.",
  legs: [
    { kind: "base", place: "El Nido", nights: 3, lat: 11.196, lng: 119.402 },
    { kind: "hop", place: "Coron", mode: "ferry", detail: "4h" },
    { kind: "base", place: "Coron", nights: 2, lat: 11.998, lng: 120.204 },
  ],
  highlights: ["The big lagoon by kayak", "Snorkelling a sunken wreck", "Kayangan lake"],
  bestMonths: "December to May",
  interests: ["Beaches", "Wildlife"],
  landscape: ["Coast"],
  effort: "Easy",
});

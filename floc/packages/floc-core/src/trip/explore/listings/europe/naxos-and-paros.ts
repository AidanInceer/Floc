import { defineTrip } from "../../define-trip";

export const naxosAndParos = defineTrip({
  id: "naxos-and-paros",
  title: "Two Cyclades, one ferry",
  operator: "TUI",
  region: "Europe",
  country: "Greece",
  groupSize: "4–12 people",
  priceFromMinor: 88000,
  currency: "EUR",
  summary:
    "Paros for the harbour bars and the windsurfers, Naxos for the mountain villages and a long sandy beach. One ferry, no planning.",
  legs: [
    { kind: "base", place: "Paros", nights: 3, lat: 37.085, lng: 25.149 },
    { kind: "hop", place: "Naxos", mode: "ferry", detail: "45m" },
    { kind: "base", place: "Naxos", nights: 3, lat: 37.105, lng: 25.376 },
  ],
  highlights: ["Naoussa harbour after dark", "The Portara at sunset", "Kitron in Halki village"],
  bestMonths: "May to October",
  interests: ["Beaches", "Food"],
  landscape: ["Coast"],
  effort: "Easy",
});

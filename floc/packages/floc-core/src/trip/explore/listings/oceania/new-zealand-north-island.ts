import { defineTrip } from "../../define-trip";

export const newZealandNorthIsland = defineTrip({
  id: "new-zealand-north-island",
  title: "North Island road trip",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "New Zealand",
  groupSize: "4–8 people",
  priceFromMinor: 199000,
  currency: "GBP",
  summary:
    "Auckland, a boat in the Bay of Islands, Hot Water Beach on the Coromandel, the steam of Rotorua with Waitomo's glow worms, the Tongariro crossing, then Wellington.",
  legs: [
    { kind: "base", place: "Auckland", nights: 2, lat: -36.848, lng: 174.763 },
    { kind: "hop", place: "Bay of Islands", mode: "car", detail: "3h 30" },
    { kind: "base", place: "Bay of Islands", nights: 2, lat: -35.283, lng: 174.091 },
    { kind: "hop", place: "Coromandel", mode: "car", detail: "5h" },
    { kind: "base", place: "Coromandel", nights: 2, lat: -36.835, lng: 175.79 },
    { kind: "hop", place: "Rotorua", mode: "car", detail: "3h" },
    { kind: "base", place: "Rotorua", nights: 2, lat: -38.137, lng: 176.251 },
    { kind: "hop", place: "Waitomo", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Tongariro", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Tongariro", nights: 2, lat: -39.2, lng: 175.58 },
    { kind: "hop", place: "Wellington", mode: "car", detail: "4h 30" },
    { kind: "base", place: "Wellington", nights: 2, lat: -41.286, lng: 174.776 },
  ],
  highlights: ["Hot Water Beach at low tide", "Waitomo's glow worms", "The Tongariro alpine crossing"],
  bestMonths: "November to April",
  interests: ["Hiking", "Beaches"],
  landscape: ["Coast"],
  effort: "Easy",
});

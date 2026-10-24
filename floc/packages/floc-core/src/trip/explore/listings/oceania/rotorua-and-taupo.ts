import { defineTrip } from "../../define-trip";

export const rotoruaAndTaupo = defineTrip({
  id: "rotorua-and-taupo",
  title: "Rotorua and Taupō",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "New Zealand",
  groupSize: "4–12 people",
  priceFromMinor: 98000,
  currency: "NZD",
  summary:
    "Mud pools, a hāngī and a night walk through the redwoods in Rotorua, then the Tongariro crossing from Taupō.",
  legs: [
    { kind: "base", place: "Rotorua", nights: 2, lat: -38.137, lng: 176.251 },
    { kind: "hop", place: "Taupō", mode: "car", detail: "1h" },
    { kind: "base", place: "Taupō", nights: 3, lat: -38.686, lng: 176.07 },
  ],
  highlights: ["A hāngī at a marae", "The Tongariro Alpine Crossing", "Huka falls"],
  bestMonths: "November to April",
  interests: ["Hiking", "Food"],
  landscape: ["Mountains"],
  effort: "Tough",
});

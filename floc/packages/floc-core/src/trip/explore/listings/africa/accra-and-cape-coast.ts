import { defineTrip } from "../../define-trip";

export const accraAndCapeCoast = defineTrip({
  id: "accra-and-cape-coast",
  title: "Accra and the Cape Coast",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "Ghana",
  groupSize: "4–10 people",
  priceFromMinor: 68000,
  currency: "GBP",
  summary:
    "Highlife bars and Jamestown street art in Accra, then the castles of the Cape Coast and a canopy walk in Kakum forest.",
  legs: [
    { kind: "base", place: "Accra", nights: 2, lat: 5.603, lng: -0.187 },
    { kind: "hop", place: "Cape Coast", mode: "car", detail: "3h" },
    { kind: "base", place: "Cape Coast", nights: 3, lat: 5.105, lng: -1.246 },
  ],
  highlights: ["Jamestown's lighthouse", "Cape Coast castle", "Kakum canopy walkway"],
  bestMonths: "November to March",
  interests: ["History", "Food"],
  landscape: ["Coast", "Rainforest"],
  effort: "Easy",
});

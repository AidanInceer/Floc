import { defineTrip } from "../../define-trip";

export const sydneyAndBlueMountains = defineTrip({
  id: "sydney-and-blue-mountains",
  title: "Sydney and the Blue Mountains",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Australia",
  groupSize: "4–12 people",
  priceFromMinor: 112000,
  currency: "AUD",
  summary:
    "The harbour by ferry, the Bondi to Coogee walk, then up to Katoomba for the Three Sisters and the Grand Canyon track.",
  legs: [
    { kind: "base", place: "Sydney", nights: 3, lat: -33.869, lng: 151.209 },
    { kind: "hop", place: "Katoomba", mode: "train", detail: "2h" },
    { kind: "base", place: "Katoomba", nights: 2, lat: -33.712, lng: 150.311 },
  ],
  highlights: ["The Manly ferry", "Bondi to Coogee", "The Grand Canyon track"],
  bestMonths: "September to May",
  interests: ["Cities", "Hiking", "Beaches"],
  landscape: ["Coast", "Mountains"],
  effort: "Easy",
});

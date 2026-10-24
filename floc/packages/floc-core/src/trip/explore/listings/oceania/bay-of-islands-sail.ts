import { defineTrip } from "../../define-trip";

export const bayOfIslandsSail = defineTrip({
  id: "bay-of-islands-sail",
  title: "Bay of Islands by yacht",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "New Zealand",
  groupSize: "4–8 people",
  priceFromMinor: 105000,
  currency: "NZD",
  summary:
    "Paihia and the treaty grounds at Waitangi, then a skippered yacht out to the islands to swim and sleep at anchor.",
  legs: [
    { kind: "base", place: "Paihia", nights: 2, lat: -35.282, lng: 174.091 },
    { kind: "hop", place: "Bay of Islands", mode: "ferry", detail: "yacht" },
    { kind: "base", place: "Bay of Islands", nights: 2, lat: -35.2, lng: 174.2 },
  ],
  highlights: ["Waitangi treaty grounds", "The Hole in the Rock", "A night at anchor"],
  bestMonths: "December to April",
  interests: ["Beaches", "History"],
  landscape: ["Coast"],
  effort: "Easy",
});

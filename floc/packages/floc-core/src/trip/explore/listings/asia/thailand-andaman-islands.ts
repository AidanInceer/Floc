import { defineTrip } from "../../define-trip";

export const thailandAndamanIslands = defineTrip({
  id: "thailand-andaman-islands",
  title: "Bangkok and Thai islands",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "Thailand",
  groupSize: "4–10 people",
  priceFromMinor: 165000,
  currency: "GBP",
  summary:
    "Two loud nights in Bangkok, the sleeper north to Chiang Mai, then limestone cliffs and long-tail boats from Railay to Koh Lanta until somebody has to go home.",
  legs: [
    { kind: "base", place: "Bangkok", nights: 2, lat: 13.756, lng: 100.502 },
    { kind: "hop", place: "Chiang Mai", mode: "train", detail: "12h, sleeper" },
    { kind: "base", place: "Chiang Mai", nights: 3, lat: 18.788, lng: 98.985 },
    { kind: "hop", place: "Krabi", mode: "flight", detail: "2h" },
    { kind: "base", place: "Railay", nights: 3, lat: 8.011, lng: 98.838 },
    { kind: "hop", place: "Koh Phi Phi", mode: "ferry", detail: "1h 30" },
    { kind: "base", place: "Koh Phi Phi", nights: 2, lat: 7.74, lng: 98.77 },
    { kind: "hop", place: "Koh Lanta", mode: "ferry", detail: "1h 30" },
    { kind: "base", place: "Koh Lanta", nights: 3, lat: 7.624, lng: 99.079 },
  ],
  highlights: ["Sleeper train to Chiang Mai", "Four islands by long-tail", "Sunset from Railay west"],
  bestMonths: "November to April",
  interests: ["Beaches", "Food"],
  landscape: ["Coast"],
  effort: "Easy",
});

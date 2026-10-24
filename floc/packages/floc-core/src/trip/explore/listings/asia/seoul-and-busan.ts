import { defineTrip } from "../../define-trip";

export const seoulAndBusan = defineTrip({
  id: "seoul-and-busan",
  title: "Seoul to Busan",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "South Korea",
  groupSize: "2–8 people",
  priceFromMinor: 115000,
  currency: "GBP",
  summary:
    "Palaces, night markets and karaoke rooms in Seoul, then the KTX south to Busan for fish markets, beaches and Gamcheon's painted hills.",
  legs: [
    { kind: "base", place: "Seoul", nights: 3, lat: 37.566, lng: 126.978 },
    { kind: "hop", place: "Busan", mode: "train", detail: "2h 40" },
    { kind: "base", place: "Busan", nights: 2, lat: 35.18, lng: 129.075 },
  ],
  highlights: ["Gyeongbokgung in hanbok", "Gwangjang market at night", "Jagalchi fish market"],
  bestMonths: "April, May, September to November",
  interests: ["Cities", "Food"],
  landscape: ["Coast"],
  effort: "Easy",
});

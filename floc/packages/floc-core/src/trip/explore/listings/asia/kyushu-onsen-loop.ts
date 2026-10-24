import { defineTrip } from "../../define-trip";

export const kyushuOnsenLoop = defineTrip({
  id: "kyushu-onsen-loop",
  title: "Kyushu by hot spring",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "Japan",
  groupSize: "2–6 people",
  priceFromMinor: 128000,
  currency: "GBP",
  summary:
    "The quiet island south: Fukuoka's yatai stalls, a ryokan in Yufuin where every room has its own bath, and the steaming hells of Beppu.",
  legs: [
    { kind: "base", place: "Fukuoka", nights: 2, lat: 33.59, lng: 130.401 },
    { kind: "hop", place: "Yufuin", mode: "train", detail: "2h 10" },
    { kind: "base", place: "Yufuin", nights: 1, lat: 33.266, lng: 131.355 },
    { kind: "hop", place: "Beppu", mode: "train", detail: "1h" },
    { kind: "base", place: "Beppu", nights: 2, lat: 33.284, lng: 131.491 },
  ],
  highlights: ["Ramen at a yatai stall", "A private onsen in Yufuin", "Eggs boiled in Beppu's hells"],
  bestMonths: "October to May",
  interests: ["Food"],
  landscape: ["Mountains", "Countryside"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const sriLankaRoadAndRail = defineTrip({
  id: "sri-lanka-road-and-rail",
  title: "Sri Lanka by road and rail",
  operator: "G Adventures",
  region: "Asia",
  country: "Sri Lanka",
  groupSize: "4–12 people",
  priceFromMinor: 145000,
  currency: "GBP",
  summary:
    "The rock at Sigiriya, the temple of the tooth, the slow blue train up into the tea, leopards in Yala, then the fort town of Galle to finish.",
  legs: [
    { kind: "base", place: "Colombo", nights: 1, lat: 6.927, lng: 79.861 },
    { kind: "hop", place: "Sigiriya", mode: "car", detail: "4h" },
    { kind: "base", place: "Sigiriya", nights: 2, lat: 7.957, lng: 80.76 },
    { kind: "hop", place: "Polonnaruwa", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Kandy", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Kandy", nights: 2, lat: 7.291, lng: 80.636 },
    { kind: "hop", place: "Ella", mode: "train", detail: "7h, the hill line" },
    { kind: "base", place: "Ella", nights: 2, lat: 6.866, lng: 81.046 },
    { kind: "hop", place: "Yala", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Yala", nights: 2, lat: 6.372, lng: 81.52 },
    { kind: "hop", place: "Galle", mode: "car", detail: "3h" },
    { kind: "base", place: "Galle", nights: 3, lat: 6.032, lng: 80.217 },
  ],
  highlights: ["Sigiriya rock at first light", "The train from Kandy to Ella", "Leopards in Yala"],
  bestMonths: "December to April",
  interests: ["Wildlife", "History", "Hiking"],
  landscape: ["Rainforest", "Mountains"],
  effort: "Moderate",
});

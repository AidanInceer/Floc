import { defineTrip } from "../../define-trip";

export const kathmanduAndPoonHill = defineTrip({
  id: "kathmandu-and-poon-hill",
  title: "Kathmandu and a Poon Hill walk",
  operator: "Much Better Adventures",
  region: "Asia",
  country: "Nepal",
  groupSize: "4–10 people",
  priceFromMinor: 79000,
  currency: "GBP",
  summary:
    "Durbar squares in Kathmandu, then Pokhara and a short teahouse trek to see the Annapurnas from Poon Hill at sunrise.",
  legs: [
    { kind: "base", place: "Kathmandu", nights: 2, lat: 27.717, lng: 85.324 },
    { kind: "hop", place: "Pokhara", mode: "flight", detail: "30m" },
    { kind: "base", place: "Pokhara", nights: 1, lat: 28.209, lng: 83.986 },
    { kind: "hop", place: "Ghorepani", mode: "car", detail: "drive and walk" },
    { kind: "base", place: "Ghorepani", nights: 2, lat: 28.4, lng: 83.7 },
  ],
  highlights: ["Bhaktapur's squares", "Sunrise from Poon Hill", "Dal bhat in a teahouse"],
  bestMonths: "October to April",
  interests: ["Hiking", "History"],
  landscape: ["Mountains"],
  effort: "Tough",
});

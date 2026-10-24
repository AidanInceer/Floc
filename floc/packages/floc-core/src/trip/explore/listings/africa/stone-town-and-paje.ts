import { defineTrip } from "../../define-trip";

export const stoneTownAndPaje = defineTrip({
  id: "stone-town-and-paje",
  title: "Stone Town and the east coast",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "Tanzania",
  groupSize: "2–10 people",
  priceFromMinor: 72000,
  currency: "GBP",
  summary:
    "A spice tour and the Forodhani night market in Stone Town, then a beach on the east coast for kitesurfing and a boat to Mnemba.",
  legs: [
    { kind: "base", place: "Stone Town", nights: 2, lat: -6.163, lng: 39.188 },
    { kind: "hop", place: "Paje", mode: "car", detail: "1h" },
    { kind: "base", place: "Paje", nights: 3, lat: -6.269, lng: 39.536 },
  ],
  highlights: ["Forodhani food market", "Snorkelling Mnemba atoll", "A kite lesson at Paje"],
  bestMonths: "June to October, January, February",
  interests: ["Beaches", "Food", "History"],
  landscape: ["Coast"],
  effort: "Easy",
});

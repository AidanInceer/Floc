import { defineTrip } from "../../define-trip";

export const istanbulAndCappadocia = defineTrip({
  id: "istanbul-and-cappadocia",
  title: "Istanbul and Cappadocia",
  operator: "Intrepid Travel",
  region: "Europe",
  country: "Turkey",
  groupSize: "4–12 people",
  priceFromMinor: 72000,
  currency: "GBP",
  summary:
    "Three nights by the Bosphorus with a ferry to Asia for lunch, then a short flight to cave hotels and a balloon at sunrise.",
  legs: [
    { kind: "base", place: "Istanbul", nights: 3, lat: 41.008, lng: 28.978 },
    { kind: "hop", place: "Göreme", mode: "flight", detail: "1h 20" },
    { kind: "base", place: "Göreme", nights: 2, lat: 38.643, lng: 34.829 },
  ],
  highlights: ["Ferry to Kadıköy for lunch", "A balloon over the fairy chimneys", "Walking the Rose valley"],
  bestMonths: "April to June, September, October",
  interests: ["Cities", "History", "Food"],
  landscape: ["Desert"],
  effort: "Easy",
});

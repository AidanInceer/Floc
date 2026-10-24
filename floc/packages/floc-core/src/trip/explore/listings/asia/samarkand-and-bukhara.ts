import { defineTrip } from "../../define-trip";

export const samarkandAndBukhara = defineTrip({
  id: "samarkand-and-bukhara",
  title: "Samarkand and Bukhara",
  operator: "Wild Frontiers",
  region: "Asia",
  country: "Uzbekistan",
  groupSize: "4–12 people",
  priceFromMinor: 95000,
  currency: "GBP",
  summary:
    "The tiled Registan, then the fast train to Bukhara's old town, a caravanserai bed and plov cooked in a cauldron the size of a bath.",
  legs: [
    { kind: "base", place: "Samarkand", nights: 3, lat: 39.627, lng: 66.975 },
    { kind: "hop", place: "Bukhara", mode: "train", detail: "1h 40" },
    { kind: "base", place: "Bukhara", nights: 3, lat: 39.767, lng: 64.423 },
  ],
  highlights: ["The Registan lit at night", "Plov at the central market", "The Kalyan minaret"],
  bestMonths: "April, May, September, October",
  interests: ["History", "Food"],
  landscape: ["Desert"],
  effort: "Easy",
});

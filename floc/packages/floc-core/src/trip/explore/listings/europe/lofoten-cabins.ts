import { defineTrip } from "../../define-trip";

export const lofotenCabins = defineTrip({
  id: "lofoten-cabins",
  title: "Lofoten in fishermen's cabins",
  operator: "Much Better Adventures",
  region: "Europe",
  country: "Norway",
  groupSize: "4–8 people",
  priceFromMinor: 98000,
  currency: "GBP",
  summary:
    "Fly to Bodø, ferry over, then two red rorbu cabins: one in Reine for the ridge walks, one in Henningsvær for the surf beach and the football pitch on the rocks.",
  legs: [
    { kind: "base", place: "Reine", nights: 2, lat: 67.932, lng: 13.089 },
    { kind: "hop", place: "Henningsvær", mode: "car", detail: "2h" },
    { kind: "base", place: "Henningsvær", nights: 2, lat: 68.153, lng: 14.204 },
  ],
  highlights: ["Reinebringen under the midnight sun", "A swim at Haukland beach", "Stockfish racks in Å"],
  bestMonths: "June to August",
  interests: ["Hiking"],
  landscape: ["Mountains", "Coast"],
  effort: "Moderate",
});

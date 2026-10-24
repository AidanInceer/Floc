import { defineTrip } from "../../define-trip";

export const banffToJasper = defineTrip({
  id: "banff-to-jasper",
  title: "Banff to Jasper",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Canada",
  groupSize: "2–8 people",
  priceFromMinor: 125000,
  currency: "CAD",
  summary:
    "Lake Louise and a teahouse hike, then the Icefields Parkway north to Jasper for elk, hot springs and Maligne canyon.",
  legs: [
    { kind: "base", place: "Banff", nights: 3, lat: 51.178, lng: -115.571 },
    { kind: "hop", place: "Jasper", mode: "car", detail: "Icefields Parkway, 4h" },
    { kind: "base", place: "Jasper", nights: 2, lat: 52.873, lng: -118.082 },
  ],
  highlights: ["Lake Agnes teahouse", "The Icefields Parkway", "Maligne canyon"],
  bestMonths: "June to September",
  interests: ["Hiking", "Wildlife"],
  landscape: ["Mountains"],
  effort: "Moderate",
});

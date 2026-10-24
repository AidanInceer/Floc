import { defineTrip } from "../../define-trip";

export const masaiMaraToZanzibar = defineTrip({
  id: "masai-mara-to-zanzibar",
  title: "Masai Mara to Zanzibar",
  operator: "G Adventures",
  region: "Africa",
  country: "Kenya, Tanzania",
  groupSize: "4–10 people",
  priceFromMinor: 365000,
  currency: "GBP",
  summary:
    "Three dawns in the Mara, a short flight to the Serengeti, down into the Ngorongoro crater, then Stone Town's spice market and three days on a Zanzibar beach.",
  legs: [
    { kind: "base", place: "Nairobi", nights: 1, lat: -1.292, lng: 36.822, country: "KE" },
    { kind: "hop", place: "Masai Mara", mode: "flight", detail: "1h" },
    { kind: "base", place: "Masai Mara", nights: 3, lat: -1.406, lng: 35.143, country: "KE" },
    { kind: "hop", place: "Serengeti", mode: "flight", detail: "1h 30" },
    { kind: "base", place: "Serengeti", nights: 3, lat: -2.333, lng: 34.833, country: "TZ" },
    { kind: "hop", place: "Ngorongoro", mode: "car", detail: "4h" },
    { kind: "base", place: "Ngorongoro", nights: 2, lat: -3.24, lng: 35.487, country: "TZ" },
    { kind: "hop", place: "Zanzibar", mode: "flight", detail: "1h 30" },
    { kind: "base", place: "Stone Town", nights: 2, lat: -6.165, lng: 39.189, country: "TZ" },
    { kind: "hop", place: "Paje", mode: "car", detail: "1h" },
    { kind: "base", place: "Paje", nights: 3, lat: -6.264, lng: 39.535, country: "TZ" },
  ],
  highlights: ["Dawn game drives in the Mara", "Down into the Ngorongoro crater", "Stone Town's spice market"],
  bestMonths: "June to October",
  interests: ["Wildlife", "Beaches"],
  landscape: ["Savannah", "Coast"],
  effort: "Moderate",
});

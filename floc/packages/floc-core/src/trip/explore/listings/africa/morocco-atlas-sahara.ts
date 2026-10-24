import { defineTrip } from "../../define-trip";

export const moroccoAtlasSahara = defineTrip({
  id: "morocco-atlas-sahara",
  title: "Atlas mountains and Sahara",
  operator: "G Adventures",
  region: "Africa",
  country: "Morocco",
  groupSize: "6–12 people",
  priceFromMinor: 109500,
  currency: "GBP",
  summary:
    "Marrakech, two nights in a Berber village in the High Atlas, the kasbah road to the Dades gorge, camels and a desert camp at Erg Chebbi, then the long drive north to Fes.",
  legs: [
    { kind: "base", place: "Marrakech", nights: 2, lat: 31.63, lng: -7.989 },
    { kind: "hop", place: "Imlil", mode: "car", detail: "2h" },
    { kind: "base", place: "Imlil", nights: 2, lat: 31.136, lng: -7.919 },
    { kind: "hop", place: "Aït Benhaddou", mode: "car", detail: "4h" },
    { kind: "base", place: "Aït Benhaddou", nights: 1, lat: 31.047, lng: -7.13 },
    { kind: "hop", place: "Dades gorge", mode: "car", detail: "3h" },
    { kind: "base", place: "Dades gorge", nights: 1, lat: 31.363, lng: -5.885 },
    { kind: "hop", place: "Erg Chebbi", mode: "car", detail: "4h" },
    { kind: "base", place: "Erg Chebbi", nights: 1, lat: 31.099, lng: -3.976 },
    { kind: "hop", place: "Fes", mode: "car", detail: "8h" },
    { kind: "base", place: "Fes", nights: 3, lat: 34.033, lng: -5.0 },
  ],
  highlights: ["Imlil valley trek with a local guide", "A night under canvas in the dunes", "Lost in the Fes medina"],
  bestMonths: "March to May, October",
  interests: ["Hiking", "Food"],
  landscape: ["Mountains", "Desert"],
  effort: "Moderate",
});

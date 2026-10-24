import { defineTrip } from "../../define-trip";

export const connemaraAndAran = defineTrip({
  id: "connemara-and-aran",
  title: "Galway and Inis Mór",
  operator: "Floc editorial",
  editorial: true,
  region: "Europe",
  country: "Ireland",
  groupSize: "4–10 people",
  priceFromMinor: 69000,
  currency: "EUR",
  summary:
    "Trad sessions in Galway, then out on the ferry to Inis Mór: bikes, stone walls and Dún Aonghasa on the edge of the cliffs.",
  legs: [
    { kind: "base", place: "Galway", nights: 2, lat: 53.271, lng: -9.057 },
    { kind: "hop", place: "Inis Mór", mode: "ferry", detail: "40m" },
    { kind: "base", place: "Inis Mór", nights: 2, lat: 53.117, lng: -9.67 },
  ],
  highlights: ["A session at Tig Cóilí", "Cycling Inis Mór", "Dún Aonghasa's cliff fort"],
  bestMonths: "May to September",
  interests: ["Food", "History"],
  landscape: ["Coast", "Countryside"],
  effort: "Easy",
});

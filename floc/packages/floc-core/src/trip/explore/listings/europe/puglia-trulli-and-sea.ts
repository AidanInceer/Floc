import { defineTrip } from "../../define-trip";

export const pugliaTrulliAndSea = defineTrip({
  id: "puglia-trulli-and-sea",
  title: "Trulli and the Puglia coast",
  operator: "Intrepid Travel",
  region: "Europe",
  country: "Italy",
  groupSize: "4–10 people",
  priceFromMinor: 76000,
  currency: "EUR",
  summary:
    "A masseria in the olive groves near Alberobello, then Polignano a Mare for cliff swims and a boat into the sea caves.",
  legs: [
    { kind: "base", place: "Alberobello", nights: 3, lat: 40.784, lng: 17.24 },
    { kind: "hop", place: "Polignano a Mare", mode: "car", detail: "40m" },
    { kind: "base", place: "Polignano a Mare", nights: 2, lat: 40.995, lng: 17.219 },
  ],
  highlights: ["A night in a trullo", "Orecchiette with the pasta makers of Bari", "Lama Monachile from the water"],
  bestMonths: "May to October",
  interests: ["Food", "Beaches"],
  landscape: ["Coast", "Countryside"],
  effort: "Easy",
});

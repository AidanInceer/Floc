import { defineTrip } from "../../define-trip";

export const faroToTaviraByTrain = defineTrip({
  id: "faro-to-tavira-by-train",
  title: "The Algarve without a car",
  operator: "Floc editorial",
  editorial: true,
  region: "Europe",
  country: "Portugal",
  groupSize: "2–10 people",
  priceFromMinor: 42000,
  currency: "EUR",
  summary:
    "The quiet east end of the Algarve, all by the coastal train: Faro's old town, then Tavira and a little ferry to an island of nothing but beach.",
  legs: [
    { kind: "base", place: "Faro", nights: 1, lat: 37.019, lng: -7.93 },
    { kind: "hop", place: "Tavira", mode: "train", detail: "35m" },
    { kind: "base", place: "Tavira", nights: 3, lat: 37.127, lng: -7.65 },
  ],
  highlights: ["Ilha de Tavira by water taxi", "Clams on the Ria Formosa", "The bone chapel in Faro"],
  bestMonths: "May, June, September, October",
  interests: ["Beaches", "Food"],
  landscape: ["Coast"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const albanianRiviera = defineTrip({
  id: "albanian-riviera",
  title: "The Albanian Riviera",
  operator: "Floc editorial",
  editorial: true,
  region: "Europe",
  country: "Albania",
  groupSize: "4–10 people",
  priceFromMinor: 39000,
  currency: "EUR",
  summary:
    "Cheap, empty and very blue: Himarë for the coves, then a mountain road past the Blue Eye spring to Gjirokastër's stone town.",
  legs: [
    { kind: "base", place: "Himarë", nights: 3, lat: 40.101, lng: 19.745 },
    { kind: "hop", place: "Gjirokastër", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Gjirokastër", nights: 2, lat: 40.076, lng: 20.139 },
  ],
  highlights: ["Gjipe beach on foot", "The Blue Eye spring", "Gjirokastër castle at dusk"],
  bestMonths: "June to September",
  interests: ["Beaches", "History"],
  landscape: ["Coast", "Mountains"],
  effort: "Easy",
});

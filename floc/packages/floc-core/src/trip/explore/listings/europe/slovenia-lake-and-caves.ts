import { defineTrip } from "../../define-trip";

export const sloveniaLakeAndCaves = defineTrip({
  id: "slovenia-lake-and-caves",
  title: "Ljubljana, Bled and the caves",
  operator: "Floc editorial",
  editorial: true,
  region: "Europe",
  country: "Slovenia",
  groupSize: "2–8 people",
  priceFromMinor: 54000,
  currency: "EUR",
  summary:
    "A small country in five nights: river bars in Ljubljana, a rowing boat to Bled's island, a day underground at Škocjan, and the sea at Piran.",
  legs: [
    { kind: "base", place: "Ljubljana", nights: 2, lat: 46.056, lng: 14.506 },
    { kind: "hop", place: "Bled", mode: "car", detail: "45m" },
    { kind: "base", place: "Bled", nights: 2, lat: 46.369, lng: 14.114 },
    { kind: "hop", place: "Piran", mode: "car", detail: "via Škocjan, 2h" },
    { kind: "base", place: "Piran", nights: 1, lat: 45.528, lng: 13.568 },
  ],
  highlights: ["Rowing out to Bled island", "The Škocjan gorge underground", "Sunset on Piran's walls"],
  bestMonths: "May to September",
  interests: ["Hiking", "Food"],
  landscape: ["Mountains", "Countryside"],
  effort: "Easy",
});

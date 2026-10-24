import { defineTrip } from "../../define-trip";

export const hoiAnAndHue = defineTrip({
  id: "hoi-an-and-hue",
  title: "Hội An and Huế",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "Vietnam",
  groupSize: "2–10 people",
  priceFromMinor: 58000,
  currency: "GBP",
  summary:
    "Tailors, lanterns and bikes to the beach in Hội An, then over the Hải Vân pass to the imperial city at Huế.",
  legs: [
    { kind: "base", place: "Hội An", nights: 3, lat: 15.88, lng: 108.338 },
    { kind: "hop", place: "Huế", mode: "car", detail: "Hải Vân pass, 3h" },
    { kind: "base", place: "Huế", nights: 2, lat: 16.463, lng: 107.59 },
  ],
  highlights: ["Lantern boats on the Thu Bồn", "The Hải Vân pass", "Bún bò Huế for breakfast"],
  bestMonths: "February to May",
  interests: ["Food", "History"],
  landscape: ["Coast"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const oaxacaForFood = defineTrip({
  id: "oaxaca-for-food",
  title: "Oaxaca for food",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Mexico",
  groupSize: "2–10 people",
  priceFromMinor: 56000,
  currency: "USD",
  summary:
    "One city, five nights, a lot of mole: a market cooking class, tlayudas at night, a mezcal palenque and the petrified falls of Hierve el Agua.",
  legs: [
    { kind: "base", place: "Oaxaca", nights: 5, lat: 17.073, lng: -96.726 },
    { kind: "hop", place: "Hierve el Agua", mode: "car", detail: "day trip" },
  ],
  highlights: ["A cooking class from the market", "Mezcal at a village palenque", "Monte Albán"],
  bestMonths: "October to April",
  interests: ["Food", "History"],
  landscape: ["Mountains"],
  effort: "Easy",
});

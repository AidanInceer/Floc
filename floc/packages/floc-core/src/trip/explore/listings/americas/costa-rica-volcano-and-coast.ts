import { defineTrip } from "../../define-trip";

export const costaRicaVolcanoAndCoast = defineTrip({
  id: "costa-rica-volcano-and-coast",
  title: "Costa Rica volcanoes and coast",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Costa Rica",
  groupSize: "4–8 people",
  priceFromMinor: 159000,
  currency: "GBP",
  summary:
    "By river to the turtle beaches of Tortuguero, hot springs under Arenal, bridges in the Monteverde cloud forest, then a beach house near Manuel Antonio with sloths in the garden if you are lucky.",
  legs: [
    { kind: "base", place: "San José", nights: 1, lat: 9.928, lng: -84.091 },
    { kind: "hop", place: "Tortuguero", mode: "ferry", detail: "4h by road and river" },
    { kind: "base", place: "Tortuguero", nights: 2, lat: 10.542, lng: -83.502 },
    { kind: "hop", place: "La Fortuna", mode: "car", detail: "5h" },
    { kind: "base", place: "La Fortuna", nights: 3, lat: 10.471, lng: -84.645 },
    { kind: "hop", place: "Monteverde", mode: "car", detail: "3h" },
    { kind: "base", place: "Monteverde", nights: 2, lat: 10.301, lng: -84.825 },
    { kind: "hop", place: "Manuel Antonio", mode: "car", detail: "4h" },
    { kind: "base", place: "Manuel Antonio", nights: 3, lat: 9.392, lng: -84.137 },
  ],
  highlights: ["Turtles nesting at Tortuguero", "Hot springs under Arenal", "Cloud forest bridges at Monteverde"],
  bestMonths: "December to April",
  interests: ["Wildlife", "Beaches", "Hiking"],
  landscape: ["Rainforest", "Coast"],
  effort: "Moderate",
});

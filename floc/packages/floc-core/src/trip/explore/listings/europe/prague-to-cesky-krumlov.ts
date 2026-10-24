import { defineTrip } from "../../define-trip";

export const pragueToCeskyKrumlov = defineTrip({
  id: "prague-to-cesky-krumlov",
  title: "Prague and Český Krumlov",
  operator: "Floc editorial",
  editorial: true,
  region: "Europe",
  country: "Czech Republic",
  groupSize: "4–12 people",
  priceFromMinor: 46000,
  currency: "EUR",
  summary:
    "Beer halls and the castle in Prague, then a bus south to the bend in the river at Český Krumlov, where the group floats down it in rafts.",
  legs: [
    { kind: "base", place: "Prague", nights: 3, lat: 50.075, lng: 14.437 },
    { kind: "hop", place: "Český Krumlov", mode: "other", detail: "bus 3h" },
    { kind: "base", place: "Český Krumlov", nights: 2, lat: 48.81, lng: 14.315 },
  ],
  highlights: ["A tank beer at U Pinkasů", "Rafting the Vltava", "The castle's baroque theatre"],
  bestMonths: "May to September",
  interests: ["Cities", "History", "Food"],
  landscape: ["Countryside"],
  effort: "Easy",
});

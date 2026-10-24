import { defineTrip } from "../../define-trip";

export const victoriaFallsBothSides = defineTrip({
  id: "victoria-falls-both-sides",
  title: "Victoria Falls, both sides",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "Zambia, Zimbabwe",
  groupSize: "4–12 people",
  priceFromMinor: 89000,
  currency: "USD",
  summary:
    "Livingstone for Devil's Pool on the lip of the falls, then over the bridge to Zimbabwe for the rainforest walk and a sunset cruise.",
  legs: [
    { kind: "base", place: "Livingstone", nights: 2, lat: -17.85, lng: 25.856, country: "ZM" },
    { kind: "hop", place: "Victoria Falls town", mode: "car", detail: "over the bridge, 30m" },
    { kind: "base", place: "Victoria Falls town", nights: 2, lat: -17.932, lng: 25.83, country: "ZW" },
  ],
  highlights: ["Devil's Pool", "Sundowners on the Zambezi", "The falls from the rainforest path"],
  bestMonths: "August to December",
  interests: ["Wildlife", "Hiking"],
  landscape: ["Rainforest", "Savannah"],
  effort: "Moderate",
});

import { defineTrip } from "../../define-trip";

export const taipeiAndTaroko = defineTrip({
  id: "taipei-and-taroko",
  title: "Taipei and Taroko gorge",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "Taiwan",
  groupSize: "2–8 people",
  priceFromMinor: 89000,
  currency: "GBP",
  summary:
    "Night markets and hot springs in Taipei, then the train down the east coast to the marble walls of Taroko gorge.",
  legs: [
    { kind: "base", place: "Taipei", nights: 3, lat: 25.033, lng: 121.565 },
    { kind: "hop", place: "Hualien", mode: "train", detail: "2h 15" },
    { kind: "base", place: "Hualien", nights: 2, lat: 23.991, lng: 121.611 },
  ],
  highlights: ["Raohe night market", "Beitou hot springs", "Shakadang trail in Taroko"],
  bestMonths: "October to April",
  interests: ["Food", "Hiking", "Cities"],
  landscape: ["Mountains", "Coast"],
  effort: "Moderate",
});

import { defineTrip } from "../../define-trip";

export const portDouglasAndDaintree = defineTrip({
  id: "port-douglas-and-daintree",
  title: "Reef and rainforest",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Australia",
  groupSize: "2–10 people",
  priceFromMinor: 129000,
  currency: "AUD",
  summary:
    "A day boat to the outer reef from Port Douglas, then the river ferry into the Daintree for a croc cruise and two nights in the rainforest.",
  legs: [
    { kind: "base", place: "Port Douglas", nights: 3, lat: -16.484, lng: 145.465 },
    { kind: "hop", place: "Cape Tribulation", mode: "car", detail: "1h 15" },
    { kind: "base", place: "Cape Tribulation", nights: 2, lat: -16.09, lng: 145.46 },
  ],
  highlights: ["The outer reef", "A croc cruise on the Daintree", "Where the rainforest meets the reef"],
  bestMonths: "May to October",
  interests: ["Wildlife", "Beaches"],
  landscape: ["Rainforest", "Coast"],
  effort: "Easy",
});

import { defineTrip } from "../../define-trip";

export const zionAndBryce = defineTrip({
  id: "zion-and-bryce",
  title: "Zion and Bryce",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "United States",
  groupSize: "2–8 people",
  priceFromMinor: 115000,
  currency: "USD",
  summary:
    "Fly to Las Vegas and drive away from it: Angels Landing and the Narrows in Zion, then the hoodoos of Bryce Canyon at sunrise.",
  legs: [
    { kind: "base", place: "Springdale", nights: 3, lat: 37.189, lng: -113 },
    { kind: "hop", place: "Bryce Canyon", mode: "car", detail: "2h" },
    { kind: "base", place: "Bryce Canyon", nights: 2, lat: 37.593, lng: -112.187 },
  ],
  highlights: ["Wading the Narrows", "Angels Landing", "Sunrise Point, Bryce"],
  bestMonths: "April to June, September, October",
  interests: ["Hiking"],
  landscape: ["Desert", "Mountains"],
  effort: "Moderate",
});

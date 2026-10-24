import { defineTrip } from "../../define-trip";

export const vanuatuVolcano = defineTrip({
  id: "vanuatu-volcano",
  title: "Port Vila and Mount Yasur",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Vanuatu",
  groupSize: "2–8 people",
  priceFromMinor: 155000,
  currency: "AUD",
  summary:
    "Blue holes and kava bars on Efate, then a small plane to Tanna to stand on the rim of Mount Yasur as it throws lava at dusk.",
  legs: [
    { kind: "base", place: "Port Vila", nights: 2, lat: -17.734, lng: 168.322 },
    { kind: "hop", place: "Tanna", mode: "flight", detail: "1h" },
    { kind: "base", place: "Tanna", nights: 2, lat: -19.53, lng: 169.27 },
  ],
  highlights: ["Mount Yasur at dusk", "Swimming a blue hole", "Kava in a nakamal"],
  bestMonths: "May to October",
  interests: ["Hiking", "Beaches"],
  landscape: ["Rainforest", "Coast"],
  effort: "Moderate",
});

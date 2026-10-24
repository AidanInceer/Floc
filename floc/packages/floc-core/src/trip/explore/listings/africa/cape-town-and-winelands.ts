import { defineTrip } from "../../define-trip";

export const capeTownAndWinelands = defineTrip({
  id: "cape-town-and-winelands",
  title: "Cape Town and the winelands",
  operator: "Floc editorial",
  editorial: true,
  region: "Africa",
  country: "South Africa",
  groupSize: "4–10 people",
  priceFromMinor: 98000,
  currency: "GBP",
  summary:
    "Table Mountain, Boulders beach and the cape, then a cottage in Franschhoek with bikes between the wine farms.",
  legs: [
    { kind: "base", place: "Cape Town", nights: 3, lat: -33.925, lng: 18.424 },
    { kind: "hop", place: "Franschhoek", mode: "car", detail: "1h 15" },
    { kind: "base", place: "Franschhoek", nights: 2, lat: -33.913, lng: 19.12 },
  ],
  highlights: ["Lion's Head at sunrise", "Penguins at Boulders", "The Franschhoek wine tram"],
  bestMonths: "October to April",
  interests: ["Food", "Wildlife", "Hiking"],
  landscape: ["Mountains", "Coast"],
  effort: "Easy",
});

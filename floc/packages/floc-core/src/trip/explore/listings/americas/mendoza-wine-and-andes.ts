import { defineTrip } from "../../define-trip";

export const mendozaWineAndAndes = defineTrip({
  id: "mendoza-wine-and-andes",
  title: "Mendoza wine and the Andes",
  operator: "Floc editorial",
  editorial: true,
  region: "Americas",
  country: "Argentina",
  groupSize: "4–10 people",
  priceFromMinor: 82000,
  currency: "USD",
  summary:
    "Bikes between bodegas in Maipú, a long asado lunch in the Uco valley, and a day drive to Aconcagua.",
  legs: [
    { kind: "base", place: "Mendoza", nights: 3, lat: -32.889, lng: -68.845 },
    { kind: "hop", place: "Uco valley", mode: "car", detail: "1h 30" },
    { kind: "base", place: "Uco valley", nights: 2, lat: -33.6, lng: -69.2 },
  ],
  highlights: ["Cycling the Maipú bodegas", "An asado in the vines", "The road to Aconcagua"],
  bestMonths: "March, April, October, November",
  interests: ["Food"],
  landscape: ["Mountains", "Countryside"],
  effort: "Easy",
});

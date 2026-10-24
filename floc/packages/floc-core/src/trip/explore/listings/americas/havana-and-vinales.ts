import { defineTrip } from "../../define-trip";

export const havanaAndVinales = defineTrip({
  id: "havana-and-vinales",
  title: "Havana and Viñales",
  operator: "Intrepid Travel",
  region: "Americas",
  country: "Cuba",
  groupSize: "4–12 people",
  priceFromMinor: 78000,
  currency: "GBP",
  summary:
    "Classic cars and rooftop rumba in Havana, then a casa particular in the tobacco valley at Viñales, explored on horseback.",
  legs: [
    { kind: "base", place: "Havana", nights: 3, lat: 23.113, lng: -82.366 },
    { kind: "hop", place: "Viñales", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Viñales", nights: 2, lat: 22.616, lng: -83.706 },
  ],
  highlights: ["The Malecón at sunset", "Riding to a tobacco farm", "Live son in a Havana bar"],
  bestMonths: "November to April",
  interests: ["History", "Cities"],
  landscape: ["Countryside"],
  effort: "Easy",
});

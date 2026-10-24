import { defineTrip } from "../../define-trip";

export const hobartAndFreycinet = defineTrip({
  id: "hobart-and-freycinet",
  title: "Hobart and Freycinet",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Australia",
  groupSize: "2–8 people",
  priceFromMinor: 145000,
  currency: "AUD",
  summary:
    "Salamanca market and MONA in Hobart, then the east coast to Wineglass Bay and oysters on the beach at Freycinet.",
  legs: [
    { kind: "base", place: "Hobart", nights: 2, lat: -42.882, lng: 147.327 },
    { kind: "hop", place: "Coles Bay", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Coles Bay", nights: 3, lat: -42.12, lng: 148.28 },
  ],
  highlights: ["The ferry to MONA", "Wineglass Bay lookout", "Oysters in Coles Bay"],
  bestMonths: "November to April",
  interests: ["Food", "Hiking"],
  landscape: ["Coast"],
  effort: "Easy",
});

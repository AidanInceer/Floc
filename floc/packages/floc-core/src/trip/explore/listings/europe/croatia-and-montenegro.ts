import { defineTrip } from "../../define-trip";

export const croatiaAndMontenegro = defineTrip({
  id: "croatia-and-montenegro",
  title: "Split to Kotor by sea",
  operator: "Much Better Adventures",
  region: "Europe",
  country: "Croatia, Montenegro",
  groupSize: "6–12 people",
  priceFromMinor: 149000,
  currency: "EUR",
  summary:
    "Down the Dalmatian coast by fast ferry: Split and the falls at Krka, Hvar, Korčula, three nights in Dubrovnik, then over the border to the bay of Kotor.",
  legs: [
    { kind: "base", place: "Split", nights: 2, lat: 43.508, lng: 16.44, country: "HR" },
    { kind: "hop", place: "Krka", mode: "car", detail: "day trip" },
    { kind: "hop", place: "Hvar", mode: "ferry", detail: "1h" },
    { kind: "base", place: "Hvar", nights: 2, lat: 43.172, lng: 16.443, country: "HR" },
    { kind: "hop", place: "Korčula", mode: "ferry", detail: "1h 30" },
    { kind: "base", place: "Korčula", nights: 2, lat: 42.961, lng: 17.136, country: "HR" },
    { kind: "hop", place: "Dubrovnik", mode: "ferry", detail: "2h" },
    { kind: "base", place: "Dubrovnik", nights: 3, lat: 42.65, lng: 18.094, country: "HR" },
    { kind: "hop", place: "Kotor", mode: "car", detail: "2h 30" },
    { kind: "base", place: "Kotor", nights: 2, lat: 42.424, lng: 18.771, country: "ME" },
  ],
  highlights: ["Krka's waterfalls", "Island to island by fast ferry", "Dubrovnik's walls at dusk"],
  bestMonths: "May, June, September",
  interests: ["Beaches", "History"],
  landscape: ["Coast"],
  effort: "Easy",
});

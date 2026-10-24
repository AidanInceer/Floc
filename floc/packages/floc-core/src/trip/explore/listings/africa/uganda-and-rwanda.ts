import { defineTrip } from "../../define-trip";

export const ugandaAndRwanda = defineTrip({
  id: "uganda-and-rwanda",
  title: "Gorillas and great lakes",
  operator: "Much Better Adventures",
  region: "Africa",
  country: "Uganda, Rwanda",
  groupSize: "4–8 people",
  priceFromMinor: 425000,
  currency: "GBP",
  summary:
    "The Nile at Murchison Falls, chimps in Kibale, tree-climbing lions in Queen Elizabeth, an hour with mountain gorillas in Bwindi, then a lake island and Kigali.",
  legs: [
    { kind: "base", place: "Entebbe", nights: 1, lat: 0.051, lng: 32.463, country: "UG" },
    { kind: "hop", place: "Murchison Falls", mode: "car", detail: "5h" },
    { kind: "base", place: "Murchison Falls", nights: 2, lat: 2.278, lng: 31.686, country: "UG" },
    { kind: "hop", place: "Kibale", mode: "car", detail: "6h" },
    { kind: "base", place: "Kibale", nights: 2, lat: 0.497, lng: 30.392, country: "UG" },
    { kind: "hop", place: "Queen Elizabeth", mode: "car", detail: "3h" },
    { kind: "base", place: "Queen Elizabeth", nights: 2, lat: -0.17, lng: 29.92, country: "UG" },
    { kind: "hop", place: "Bwindi", mode: "car", detail: "4h" },
    { kind: "base", place: "Bwindi", nights: 2, lat: -1.05, lng: 29.68, country: "UG" },
    { kind: "hop", place: "Lake Bunyonyi", mode: "car", detail: "2h" },
    { kind: "base", place: "Lake Bunyonyi", nights: 1, lat: -1.28, lng: 29.92, country: "UG" },
    { kind: "hop", place: "Kigali", mode: "car", detail: "4h 30" },
    { kind: "base", place: "Kigali", nights: 2, lat: -1.944, lng: 30.062, country: "RW" },
  ],
  highlights: ["An hour with mountain gorillas", "Chimps in Kibale forest", "The top of Murchison Falls"],
  bestMonths: "June to September, December to February",
  interests: ["Wildlife", "Hiking"],
  landscape: ["Rainforest", "Mountains"],
  effort: "Tough",
});

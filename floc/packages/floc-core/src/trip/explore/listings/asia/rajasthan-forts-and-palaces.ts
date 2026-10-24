import { defineTrip } from "../../define-trip";

export const rajasthanFortsAndPalaces = defineTrip({
  id: "rajasthan-forts-and-palaces",
  title: "Delhi, Agra and Rajasthan",
  operator: "Floc editorial",
  editorial: true,
  region: "Asia",
  country: "India",
  groupSize: "4–12 people",
  priceFromMinor: 185000,
  currency: "GBP",
  summary:
    "Old Delhi, the Taj at sunrise, then a driver and a loop of Rajasthan: the pink city, a holy lake, the blue city under its fort, and three slow days in Udaipur.",
  legs: [
    { kind: "base", place: "Delhi", nights: 3, lat: 28.614, lng: 77.209 },
    { kind: "hop", place: "Agra", mode: "train", detail: "2h" },
    { kind: "base", place: "Agra", nights: 1, lat: 27.175, lng: 78.042 },
    { kind: "hop", place: "Jaipur", mode: "car", detail: "4h 30" },
    { kind: "base", place: "Jaipur", nights: 3, lat: 26.912, lng: 75.787 },
    { kind: "hop", place: "Pushkar", mode: "car", detail: "3h" },
    { kind: "base", place: "Pushkar", nights: 2, lat: 26.49, lng: 74.551 },
    { kind: "hop", place: "Jodhpur", mode: "car", detail: "4h 30" },
    { kind: "base", place: "Jodhpur", nights: 2, lat: 26.238, lng: 73.024 },
    { kind: "hop", place: "Udaipur", mode: "car", detail: "5h" },
    { kind: "base", place: "Udaipur", nights: 3, lat: 24.585, lng: 73.713 },
    { kind: "hop", place: "Kumbhalgarh", mode: "car", detail: "day trip" },
  ],
  highlights: ["The Taj Mahal at sunrise", "Mehrangarh fort above the blue city", "A boat on Lake Pichola"],
  bestMonths: "October to March",
  interests: ["History", "Cities"],
  landscape: ["Desert"],
  effort: "Easy",
});

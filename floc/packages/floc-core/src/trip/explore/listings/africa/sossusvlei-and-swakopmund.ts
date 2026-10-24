import { defineTrip } from "../../define-trip";

export const sossusvleiAndSwakopmund = defineTrip({
  id: "sossusvlei-and-swakopmund",
  title: "Namibia's dunes and the coast",
  operator: "Wilderness Travel",
  region: "Africa",
  country: "Namibia",
  groupSize: "4–8 people",
  priceFromMinor: 145000,
  currency: "GBP",
  summary:
    "A self-drive to the red dunes of Sossusvlei, then on to Swakopmund for sandboarding and seals at Walvis Bay.",
  legs: [
    { kind: "base", place: "Sesriem", nights: 2, lat: -24.486, lng: 15.8 },
    { kind: "hop", place: "Swakopmund", mode: "car", detail: "5h" },
    { kind: "base", place: "Swakopmund", nights: 3, lat: -22.678, lng: 14.527 },
  ],
  highlights: ["Big Daddy dune at sunrise", "Deadvlei's dead trees", "Kayaking with seals"],
  bestMonths: "May to October",
  interests: ["Wildlife", "Hiking"],
  landscape: ["Desert", "Coast"],
  effort: "Moderate",
});

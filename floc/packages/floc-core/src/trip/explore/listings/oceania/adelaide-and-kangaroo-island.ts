import { defineTrip } from "../../define-trip";

export const adelaideAndKangarooIsland = defineTrip({
  id: "adelaide-and-kangaroo-island",
  title: "Adelaide and Kangaroo Island",
  operator: "Floc editorial",
  editorial: true,
  region: "Oceania",
  country: "Australia",
  groupSize: "2–8 people",
  priceFromMinor: 138000,
  currency: "AUD",
  summary:
    "Adelaide's central market and a day in the Barossa, then the ferry to Kangaroo Island for sea lions, koalas and the Remarkable Rocks.",
  legs: [
    { kind: "base", place: "Adelaide", nights: 2, lat: -34.929, lng: 138.601 },
    { kind: "hop", place: "Kangaroo Island", mode: "ferry", detail: "45m" },
    { kind: "base", place: "Kangaroo Island", nights: 3, lat: -35.8, lng: 137.2 },
  ],
  highlights: ["A day in the Barossa", "Sea lions at Seal Bay", "Remarkable Rocks"],
  bestMonths: "October to April",
  interests: ["Wildlife", "Food"],
  landscape: ["Coast"],
  effort: "Easy",
});

import type { OverviewRoute } from "@floc/core/trip/overview/route";

// Illustrative sample, not a live query — one settled Sicily trip that every
// landing section draws, so the page tells one story.
export type SamplePerson = { name: string; tone: string };

export const priya: SamplePerson = { name: "Priya", tone: "who-1" };
export const sam: SamplePerson = { name: "Sam", tone: "who-4" };
export const jo: SamplePerson = { name: "Jo", tone: "who-2" };
export const alex: SamplePerson = { name: "Alex", tone: "who-3" };
export const maya: SamplePerson = { name: "Maya", tone: "who-6" };
export const kit: SamplePerson = { name: "Kit", tone: "who-7" };
export const you: SamplePerson = { name: "You", tone: "who-5" };

export const sampleGroup = [priya, sam, jo, alex, maya, kit];

export const sampleStops = [
  { no: 1, name: "Palermo", days: 2, lat: 38.1157, lng: 13.3615 },
  { no: 2, name: "Cefalù", days: 1, lat: 38.0392, lng: 14.023 },
  { no: 3, name: "Taormina", days: 2, lat: 37.8516, lng: 15.2853 },
  { no: 4, name: "Syracuse", days: 2, lat: 37.0755, lng: 15.2866 },
];

export const sampleRoute: OverviewRoute = {
  stops: sampleStops.map((s) => ({ place: s.name, lat: s.lat, lng: s.lng, nights: s.days })),
  moves: [
    { mode: "train", time: "1h" },
    { mode: "train", time: "2h 40" },
    { mode: "car", time: "1h 30" },
  ],
  countries: ["IT"],
  uncoded: [],
  missing: [],
};

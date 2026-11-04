import type { GapKind } from "../trip/overview/left-to-sort";

export type SectionColour = "blue" | "yellow" | "green" | "red";

export const SECTION_COLOURS: Readonly<Record<string, SectionColour>> = {
  "": "blue",
  overview: "blue",
  ideas: "blue",
  dates: "yellow",
  days: "green",
  money: "red",
  packing: "blue",
  notes: "yellow",
  files: "green",
};
export const SORT_COLOURS: Readonly<Record<GapKind, SectionColour>> = {
  days: SECTION_COLOURS.dates,
  ideas: SECTION_COLOURS.ideas,
  money: SECTION_COLOURS.money,
  packing: SECTION_COLOURS.packing,
  stay: SECTION_COLOURS.overview,
  travel: SECTION_COLOURS.days,
};

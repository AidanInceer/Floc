/**
 * What the page for one Explore listing shows beyond the listing itself (#335):
 * the days, the highlights, and what to know before you go. Written by hand,
 * one file per listing in `trips/`. A listing with no file still gets a page —
 * `buildPresetPlan` fills what it can from the legs.
 */

/** Local to the trip, "HH:MM" (rule 10). `free` marks time left empty on purpose. */
export type PresetDayItem = { time: string; text: string; free?: true };

export type PresetDay = {
  title: string;
  items: PresetDayItem[];
  /** A short name for the one thing this day is for. Shown on the day and on its stop. */
  highlight?: string;
};

/**
 * One per base, in leg order, with the same `place`. A day belongs to the stop
 * the group sleeps at that night (rule 3), so a stop holds as many days as it
 * has nights; the last stop holds one more, the day everyone goes home.
 */
export type PresetStopDetail = { place: string; summary: string; days: PresetDay[] };

/** A number tile in the hero: "31" over "places, with times". */
export type PresetFigure = { value: string; label: string };

export const ADVICE_TOPICS = ["before", "money", "transport", "customs", "health", "weather"] as const;
export type AdviceTopic = (typeof ADVICE_TOPICS)[number];

export type PresetAdvice = { topic: AdviceTopic; title: string; lines: string[] };

/** A row under "Good to know". Group, season and cost are added from the listing — do not repeat them. */
export type PresetFact = { label: string; text: string };

export type PresetDetail = {
  stops: PresetStopDetail[];
  inPlan: PresetFigure[];
  advice: PresetAdvice[];
  goodToKnow: PresetFact[];
};

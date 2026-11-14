/**
 * Auto packing's ideas, before anyone takes them (#469). Pure: the web page,
 * the phone and the host's "take one" all ask the same catalogue, so an idea on
 * screen is always one the host will accept.
 */
import { dayParts, type IsoDate } from "../dates/dates";
import {
  generatePackingList,
  newSuggestionsOnly,
  type PackClimate,
  type PackContext,
  type PackSuggestion,
} from "./packing-catalogue";
import { countWord } from "../text/count-word";

export function packingIdeas(ctx: PackContext, bagLabels: string[]): PackSuggestion[] {
  return newSuggestionsOnly(generatePackingList(ctx), bagLabels);
}

/** Null without a forecast: the page says why there is none instead. */
export function climateWords(climate: PackClimate | null): string | null {
  if (!climate) return null;
  const kinds = [climate.hot && "warm", climate.cold && "cold"].filter(Boolean).join(" and ") || "mild";
  return climate.wet ? `${kinds}, with rain` : kinds;
}

export type IdeasPlan = {
  nights: number | null;
  climate: PackClimate | null;
  gap: "no-dates" | "no-place" | "no-forecast" | null;
  /** Where the nights are spent, in trip order. */
  places: readonly string[];
  /** The warmest high in the window, °C. */
  hottest: number | null;
  /** The first wet day in the window. */
  firstRain: IsoDate | null;
};

export type IdeasWhy = { text: string; link: { label: string; to: "dates" | "days"; after: string } | null };

function weatherWords(plan: IdeasPlan): string {
  const parts = [
    plan.hottest !== null ? `up to ${plan.hottest}°` : null,
    plan.firstRain ? `rain on ${dayParts(plan.firstRain).weekday}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (climateWords(plan.climate) ?? "no forecast yet");
}

/** The one line above the cubes, on web and phone. A gap comes back as a link the screen draws its own way. */
export function ideasWhy(plan: IdeasPlan): IdeasWhy {
  if (plan.gap === "no-dates" || plan.nights === null) {
    return { text: "A one-night starter.", link: { label: "Set your dates", to: "dates", after: "and the counts fit the trip." } };
  }
  if (plan.gap === "no-place") {
    return { text: `${countWord(plan.nights, "night")}.`, link: { label: "Add where you’re staying", to: "days", after: "and they pack for the weather too." } };
  }
  const where = plan.places.length > 0 ? plan.places.join(", ") : null;
  return { text: [countWord(plan.nights, "night"), where, weatherWords(plan)].filter(Boolean).join(" · "), link: null };
}

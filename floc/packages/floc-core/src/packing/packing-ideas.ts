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

export function climateWords(climate: PackClimate | null): string | null {
  if (!climate) return null;
  const kinds = [climate.hot && "warm", climate.cold && "cold"].filter(Boolean).join(" and ") || "mild";
  return climate.wet ? `${kinds}, with rain` : kinds;
}

export type IdeasPlan = {
  nights: number | null;
  climate: PackClimate | null;
  gap: "no-dates" | "no-place" | "no-forecast" | null;
  places: readonly string[];
  hottest: number | null;
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

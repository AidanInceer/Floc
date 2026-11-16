import { SECTION_COLOURS, type SectionColour } from "../design/section-colours";
import type { ActivityKind } from "./rules";

export type FeatureTag = { word: string; colour: SectionColour };

const SECTION: Partial<Record<ActivityKind, "money" | "dates" | "days" | "packing" | "files">> = {
  expense_added: "money",
  expense_changed: "money",
  settlement_recorded: "money",
  still_owe: "money",
  still_owe_week: "money",
  still_owe_month: "money",
  trip_dates_changed: "dates",
  days_added: "days",
  days_removed: "days",
  packing_claim_changed: "packing",
  booking_filed: "files",
  booking_waiting: "files",
};

export function featureTag(kind: ActivityKind): FeatureTag | null {
  const section = SECTION[kind];
  if (!section) return null;
  return { word: section[0].toUpperCase() + section.slice(1), colour: SECTION_COLOURS[section] };
}

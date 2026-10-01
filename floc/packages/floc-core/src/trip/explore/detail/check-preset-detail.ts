import type { PresetTrip } from "../preset-trip-types";
import type { PresetDay, PresetDetail } from "./preset-detail-types";
import { DERIVED_FACT_LABELS } from "./preset-plan";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function dayProblems(day: PresetDay, n: number): string[] {
  const problems: string[] = [];
  if (!day.title.trim()) problems.push(`day ${n} has no title`);
  if (day.items.length === 0) problems.push(`day ${n} has nothing in it`);
  let last = "";
  for (const item of day.items) {
    if (!TIME.test(item.time)) {
      problems.push(`day ${n}: "${item.time}" is not HH:MM`);
      continue;
    }
    if (item.time < last) problems.push(`day ${n}: ${item.time} comes after ${last}`);
    last = item.time;
  }
  return problems;
}

/** What is wrong with a hand-written detail, in words its author can act on. Empty when it fits the listing. */
export function checkPresetDetail(trip: PresetTrip, detail: PresetDetail): string[] {
  const bases = trip.legs.flatMap((l) => (l.kind === "base" ? [l] : []));
  if (detail.stops.length !== bases.length) return [`${bases.length} bases in the listing, ${detail.stops.length} stops written`];

  const problems: string[] = [];
  let n = 0;
  for (const [i, stop] of detail.stops.entries()) {
    const base = bases[i];
    if (stop.place !== base.place) problems.push(`stop ${i + 1} is "${stop.place}", the listing says "${base.place}"`);
    if (!stop.summary.trim()) problems.push(`${stop.place} has no summary`);
    const wants = base.nights + (i === bases.length - 1 ? 1 : 0);
    if (stop.days.length !== wants) problems.push(`${stop.place} has ${stop.days.length} days, wants ${wants}`);
    for (const day of stop.days) problems.push(...dayProblems(day, ++n));
  }
  if (detail.inPlan.length < 1 || detail.inPlan.length > 4) problems.push(`${detail.inPlan.length} plan figures, wants 1 to 4`);
  for (const advice of detail.advice) if (advice.lines.length === 0) problems.push(`advice "${advice.title}" has no lines`);
  for (const fact of detail.goodToKnow) {
    if (DERIVED_FACT_LABELS.includes(fact.label)) problems.push(`"${fact.label}" comes from the listing, do not repeat it`);
  }
  return problems;
}

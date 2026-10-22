import { addDays, type IsoDate } from "../../../dates/dates";
import type { DayEventType, TransportType } from "../../../vocabulary";
import { activityKind, type ActivityKind } from "../detail/activity-kind";
import type { PresetDayItem, PresetDetail } from "../detail/preset-detail-types";
import { buildPresetPlan, type PlanStop } from "../detail/preset-plan";
import { stopsOf } from "../listing-stops";
import type { PresetTrip } from "../preset-trip-types";
import { stopCountry } from "./stop-country";

/** `time` null means all day: a move whose day has no line saying when. */
export type CopyEvent = { type: DayEventType; title: string; time: string | null; transportType: TransportType | null; note: string | null };
export type CopyPlace = { name: string; lat: number; lng: number; countryCode: string | null };
/** `place` indexes `CopyPlan.places`: where the group sleeps that night (rule 3). */
export type CopyDay = { date: IsoDate; place: number; events: CopyEvent[] };
export type CopyPlan = { places: CopyPlace[]; days: CopyDay[] };

const LINE_KIND: Record<TransportType, ActivityKind | null> = { flight: "flight", train: "train", car: "drive", ferry: "ferry", other: null };

function lineEvent(item: PresetDayItem): CopyEvent {
  const type = activityKind(item) === "food" ? "food" : "activity";
  return { type, title: item.text, time: item.time, transportType: null, note: null };
}

/** The move into a stop. It takes its time from the day's first line of the same kind, and that line folds into it. */
function moveEvent(stop: PlanStop, items: PresetDayItem[]): { event: CopyEvent; line: PresetDayItem | undefined } | null {
  if (!stop.arrive) return null;
  const kind = LINE_KIND[stop.arrive.mode];
  const line = items.find((item) => !item.free && kind !== null && activityKind(item) === kind);
  const note = [line?.text, stop.arrive.detail].filter(Boolean).join(" · ") || null;
  const title = `${stop.arrive.from} to ${stop.place}`;
  return { event: { type: "transport", title, time: line?.time ?? null, transportType: stop.arrive.mode, note }, line };
}

function dayEvents(stop: PlanStop, items: PresetDayItem[], firstDay: boolean, withEvents: boolean): CopyEvent[] {
  const move = firstDay ? moveEvent(stop, items) : null;
  const lines = withEvents ? items.filter((item) => !item.free && item !== move?.line).map(lineEvent) : [];
  const events = move ? [move.event, ...lines] : lines;
  return events.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}

/**
 * What a copy of a listing writes (ADR-025): one day per date from `startDate`, each sleeping at its stop, the moves
 * between stops as transport events, and — with `events` — the listing's timed lines. Free time is left free.
 */
export function copyPlan(trip: PresetTrip, detail: PresetDetail | null, startDate: IsoDate, { events }: { events: boolean }): CopyPlan {
  const legs = stopsOf(trip);
  const places: CopyPlace[] = [];
  const days: CopyDay[] = [];
  for (const [i, stop] of buildPresetPlan(trip, detail).stops.entries()) {
    const leg = legs[i];
    let place = places.findIndex((p) => p.name === stop.place);
    if (place < 0) place = places.push({ name: stop.place, lat: leg.lat, lng: leg.lng, countryCode: stopCountry(trip, leg.country) }) - 1;
    const count = stop.nights + (i === legs.length - 1 ? 1 : 0);
    for (let d = 0; d < count; d++) {
      const date = addDays(startDate, days.length);
      days.push({ date, place, events: dayEvents(stop, stop.days[d]?.items ?? [], d === 0, events) });
    }
  }
  return { places, days };
}

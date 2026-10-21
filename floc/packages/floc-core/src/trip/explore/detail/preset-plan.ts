import { formatMoney } from "../../../money/money";
import type { TransportType } from "../../../vocabulary";
import { stopsOf } from "../listing-stops";
import type { PresetTrip } from "../preset-trip-types";
import type { PresetAdvice, PresetDay, PresetDetail, PresetFact, PresetFigure } from "./preset-detail-types";

export type PlanDay = PresetDay & { n: number };

export type PlanArrival = { mode: TransportType; detail: string; from: string; via: string | null };

export type PlanStop = {
  no: number;
  place: string;
  nights: number;
  arrive: PlanArrival | null;
  sideTrips: string[];
  summary: string | null;
  days: PlanDay[];
  highlights: string[];
};

export type PresetPlan = {
  stops: PlanStop[];
  dayCount: number;
  inPlan: PresetFigure[];
  advice: PresetAdvice[];
  goodToKnow: PresetFact[];
  /** False when nobody has written this listing's days yet. */
  detailed: boolean;
};

const count = (n: number, one: string, many: string): PresetFigure => ({ value: String(n), label: n === 1 ? one : many });

function routeStops(trip: PresetTrip): PlanStop[] {
  return stopsOf(trip).map((stop, i, all) => {
    const before = all[i - 1];
    const arrive: PlanArrival | null =
      stop.arrive && before
        ? { mode: stop.arrive.mode, detail: stop.arrive.detail, from: before.place, via: stop.arrive.place === stop.place ? null : stop.arrive.place }
        : null;
    const sideTrips = stop.dayOuts.map((out) => `${out.place} · ${out.detail}`);
    return { no: i + 1, place: stop.place, nights: stop.nights, arrive, sideTrips, summary: null, days: [], highlights: [] };
  });
}

function derivedFigures(trip: PresetTrip, stops: PlanStop[]): PresetFigure[] {
  const rides = stops.filter((s) => s.arrive).length;
  return [
    count(trip.nights, "night", "nights"),
    count(stops.length, "stop", "stops"),
    ...(rides ? [count(rides, "ride between stops", "rides between stops")] : []),
  ];
}

export const DERIVED_FACT_LABELS: readonly string[] = ["Group", "Best in", "Cost"];

function derivedFacts(trip: PresetTrip): PresetFact[] {
  return [
    { label: "Group", text: trip.groupSize },
    { label: "Best in", text: trip.bestMonths },
    { label: "Cost", text: `From ${formatMoney(trip.priceFromMinor, trip.currency)} each. Nothing is booked for you.` },
  ];
}

/** Everything the page for one listing draws. Never throws on thin or mismatched detail — it shows less. */
export function buildPresetPlan(trip: PresetTrip, detail: PresetDetail | null): PresetPlan {
  const stops = routeStops(trip);
  let n = 0;
  for (const [i, stop] of stops.entries()) {
    const written = detail?.stops[i];
    if (!written || written.place !== stop.place) continue;
    stop.summary = written.summary;
    stop.days = written.days.map((d) => ({ ...d, n: ++n }));
    stop.highlights = written.days.flatMap((d) => (d.highlight ? [d.highlight] : []));
  }
  return {
    stops,
    dayCount: n,
    inPlan: detail?.inPlan.length ? detail.inPlan : derivedFigures(trip, stops),
    advice: detail?.advice ?? [],
    goodToKnow: [...(detail?.goodToKnow ?? []), ...derivedFacts(trip)],
    detailed: n > 0,
  };
}

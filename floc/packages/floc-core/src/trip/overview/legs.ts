/**
 * The Overview's legs: one per stop (rule 3), each carrying the files that sit
 * on its days and the stay booked there, if any. Files on no leg belong to the
 * whole trip. Pure — the pages hand in days, travel modes and files.
 */
import { addDays, type IsoDate } from "../../dates/dates";
import { DOC_CATEGORIES, type DocCategory } from "../../documents/documents";
import { deriveStops, placedStops } from "../../itinerary/stops";
import type { TransportType } from "../../vocabulary";

export type LegDay = {
  dayId: number;
  date: IsoDate;
  overnightPlaceId: number | null;
  placeName: string | null;
};

export type LegFile = {
  category: DocCategory;
  dayId: number | null;
  /** The day of the event the file sits on, when it sits on one. */
  eventDayId: number | null;
};

export type Leg<F extends LegFile> = {
  /** 1-based, the same number the map's pin carries. */
  no: number;
  placeId: number;
  placeName: string;
  arrive: IsoDate;
  /** The morning after the last night. */
  leave: IsoDate;
  nights: number;
  days: { dayId: number; date: IsoDate }[];
  /** How you get here: the travel mode on the leg's first day. */
  mode: TransportType | null;
  files: F[];
  stay: F | null;
};

export function tripLegs<F extends LegFile>({
  days,
  modes,
  files,
}: {
  /** Sorted by date, as `deriveStops` needs. */
  days: LegDay[];
  modes: ReadonlyMap<number, TransportType>;
  files: F[];
}): { legs: Leg<F>[]; wholeTrip: F[] } {
  const stops = placedStops(
    deriveStops(days.map((d) => ({ ...d, overnightPlaceName: d.placeName }))),
  );
  const legs: Leg<F>[] = [];
  const legOfDay = new Map<number, Leg<F>>();
  for (const s of stops) {
    if (s.placeId === null) continue;
    const leg: Leg<F> = {
      no: legs.length + 1,
      placeId: s.placeId,
      placeName: s.placeName ?? "Unnamed place",
      arrive: s.startDate,
      leave: addDays(s.endDate, 1),
      nights: s.nights,
      days: days.filter((d) => s.dayIds.includes(d.dayId)).map((d) => ({ dayId: d.dayId, date: d.date })),
      mode: legs.length === 0 ? null : (modes.get(s.dayIds[0]) ?? null),
      files: [],
      stay: null,
    };
    legs.push(leg);
    for (const id of s.dayIds) legOfDay.set(id, leg);
  }

  const wholeTrip: F[] = [];
  for (const f of files) {
    const dayId = f.dayId ?? f.eventDayId;
    const leg = dayId === null ? undefined : legOfDay.get(dayId);
    if (!leg) {
      wholeTrip.push(f);
      continue;
    }
    leg.files.push(f);
    if (f.category === "stay" && !leg.stay) leg.stay = f;
  }
  return { legs, wholeTrip };
}

/** Each day's travel mode: its first transport event by order (ticket 78). */
export function transportModes(
  days: { id: number; events: { type: string; transportType: TransportType | null; orderIndex: number }[] }[],
): Map<number, TransportType> {
  const modes = new Map<number, TransportType>();
  for (const d of days) {
    const first = d.events
      .filter((e) => e.type === "transport" && e.transportType !== null)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0];
    if (first?.transportType) modes.set(d.id, first.transportType);
  }
  return modes;
}

const VERB: Partial<Record<TransportType, string>> = {
  flight: "Fly",
  train: "Train",
  car: "Drive",
  ferry: "Ferry",
};

/** The line between two legs: "Train to Sintra". */
export function hopLabel(mode: TransportType | null, placeName: string): string {
  const verb = mode ? VERB[mode] : undefined;
  return verb ? `${verb} to ${placeName}` : `On to ${placeName}`;
}

export function filesByCategory(
  files: { category: DocCategory }[],
): { category: DocCategory; count: number }[] {
  return DOC_CATEGORIES.map((category) => ({
    category,
    count: files.filter((f) => f.category === category).length,
  })).filter((c) => c.count > 0);
}

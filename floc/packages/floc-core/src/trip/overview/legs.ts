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
  eventDayId: number | null;
};

export type Leg<F extends LegFile> = {
  no: number;
  placeId: number;
  placeName: string;
  arrive: IsoDate;
  leave: IsoDate;
  nights: number;
  days: { dayId: number; date: IsoDate }[];
  mode: TransportType | null;
  files: F[];
  stay: F | null;
};

export function tripLegs<F extends LegFile>({
  days,
  modes,
  files,
  tripEnd,
}: {
  days: LegDay[];
  modes: ReadonlyMap<number, TransportType>;
  files: F[];
  tripEnd?: IsoDate | null;
}): { legs: Leg<F>[]; wholeTrip: F[] } {
  const stops = placedStops(
    deriveStops(days.map((d) => ({ ...d, overnightPlaceName: d.placeName })), tripEnd),
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
      leave: addDays(s.startDate, s.nights),
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
  }
  for (const leg of legs) leg.stay = hotelFile(leg.files);
  return { legs, wholeTrip };
}

export function hotelFile<F extends LegFile>(files: F[], dayIds?: ReadonlySet<number>): F | null {
  return (
    files.find((f) => {
      if (f.category !== "hotel") return false;
      if (!dayIds) return true;
      const day = f.dayId ?? f.eventDayId;
      return day !== null && dayIds.has(day);
    }) ?? null
  );
}

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

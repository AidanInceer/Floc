import type { Range } from "./budget";
import type { FlightRoute, Missing } from "./guide/guide";
import type { EstimateLine } from "./lines";
import { CABIN_LABELS, PACE_LABELS, STAY_LABELS, type TravelStyle } from "./style";

const MISSING: Record<Missing, string> = {
  home: "Where do you fly from?",
  "flight-guide": "No flight guide from here yet. Add your own figure.",
  place: "Add a place to the trip first",
  rate: "No exchange rate today",
};

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function lineDetail(
  line: { line: EstimateLine; range: Range | null; missing?: Missing; route?: FlightRoute },
  ctx: { style: TravelStyle; nights: number },
): string {
  if (line.missing && !line.range) return MISSING[line.missing];
  const days = count(ctx.nights + 1, "day");
  switch (line.line) {
    case "flights":
      if (!line.route) return line.missing ? MISSING[line.missing] : "No flights needed";
      return `${line.route.from} to ${line.route.out}, ${line.route.back} to ${line.route.from} · ${CABIN_LABELS[ctx.style.cabin]}`;
    case "stay": return `${count(ctx.nights, "night")} · ${STAY_LABELS[ctx.style.stay]} · your share`;
    case "food": return `${days} · ${STAY_LABELS[ctx.style.stay]}`;
    case "activities": return `${days} · ${PACE_LABELS[ctx.style.pace]}`;
    case "transport": return `${days} · trains, buses and taxis`;
  }
}

export function estimateSummary(homeAirport: string | null, style: TravelStyle): string {
  const lower = (s: string) => s.toLowerCase();
  return `${homeAirport ?? "No home airport"}, ${CABIN_LABELS[style.cabin]}, ${lower(STAY_LABELS[style.stay])}, ${lower(PACE_LABELS[style.pace])}`;
}

export function styleSentence(style: TravelStyle, from: string | null): string {
  const cabin = CABIN_LABELS[style.cabin] + (from ? ` from ${from}` : "");
  return `${cabin}, ${STAY_LABELS[style.stay].toLowerCase()} stays, ${PACE_LABELS[style.pace].toLowerCase()} pace`;
}

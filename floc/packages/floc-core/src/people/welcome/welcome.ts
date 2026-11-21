import { CURRENCIES, type Currency } from "../../money/currency";
import { CABINS, PACES, STAY_STYLES, type Cabin, type Pace, type StayStyle } from "../../money/estimate/style";
import { parseVibeTags } from "../../trip/vibe-tags";

export type WelcomeAnswers = {
  homeAirport?: string;
  travelCabin?: Cabin;
  travelStay?: StayStyle;
  travelPace?: Pace;
  vibeTags?: string[];
  homeCurrency?: Currency;
};

export function welcomeDue({ seenAt }: { seenAt: Date | null }): boolean {
  return seenAt === null;
}

const pick = <T extends string>(list: readonly T[], value: unknown): T | undefined =>
  typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : undefined;

const AIRPORT = /^[A-Z]{3}$/;

export function readWelcomeAnswers(input: { airport?: unknown; cabin?: unknown; stay?: unknown; pace?: unknown; vibes?: unknown; currency?: unknown }): WelcomeAnswers {
  const out: WelcomeAnswers = {};
  const airport = typeof input.airport === "string" ? input.airport.trim().toUpperCase() : "";
  if (AIRPORT.test(airport)) out.homeAirport = airport;
  const cabin = pick(CABINS, input.cabin);
  if (cabin) out.travelCabin = cabin;
  const stay = pick(STAY_STYLES, input.stay);
  if (stay) out.travelStay = stay;
  const pace = pick(PACES, input.pace);
  if (pace) out.travelPace = pace;
  const vibes = Array.isArray(input.vibes) ? parseVibeTags(input.vibes.map((v: unknown) => (typeof v === "string" ? v : null))) : [];
  if (vibes.length) out.vibeTags = vibes;
  const currency = pick(CURRENCIES, input.currency);
  if (currency) out.homeCurrency = currency;
  return out;
}

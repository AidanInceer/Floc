import { REGIONS, type Region } from "../preset-trip-types";
import { EMPTY_FINDER, NIGHTS_SCALE, PRICE_SCALE, type Finder } from "./finder";
import { isTripTag } from "./tag-groups";

const whole = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const listOf = <T>(v: unknown, keep: (x: unknown) => x is T): T[] => (Array.isArray(v) ? [...new Set(v.filter(keep))] : []);
const isRegion = (x: unknown): x is Region => typeof x === "string" && (REGIONS as readonly string[]).includes(x);
const isMonth = (x: unknown): x is number => whole(x, 1, 12);

function readNights(v: unknown): Finder["nights"] {
  if (!v || typeof v !== "object") return null;
  const { min, max } = v as Record<string, unknown>;
  return whole(min, NIGHTS_SCALE.min, NIGHTS_SCALE.max) && whole(max, min, NIGHTS_SCALE.max) ? { min, max } : null;
}

function readPrice(v: unknown): Finder["price"] {
  if (!v || typeof v !== "object") return EMPTY_FINDER.price;
  const { unit, min, max } = v as Record<string, unknown>;
  if (unit !== "trip" && unit !== "night") return EMPTY_FINDER.price;
  const top = PRICE_SCALE[unit].max;
  const lo = min === null ? 0 : min;
  const ok = (min === null || whole(min, 1, top)) && (max === null || whole(max, lo as number, top - 1));
  return ok ? { unit, min: min, max: max } : { unit, min: null, max: null };
}

/** A finder from stored JSON. What cannot be read is left out rather than refusing the whole thing. */
export function readFinder(value: unknown): Finder | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 80) : "",
    regions: listOf(raw.regions, isRegion),
    months: listOf(raw.months, isMonth),
    nights: readNights(raw.nights),
    price: readPrice(raw.price),
    likes: listOf(raw.likes, isTripTag),
  };
}

/** The finder a profile holds. Answers saved before the finder existed read as nothing. */
export function savedFinder(saved: unknown): Finder | null {
  return saved && typeof saved === "object" ? readFinder((saved as { finder?: unknown }).finder) : null;
}

import { NIGHTS_SCALE, PRICE_SCALE, type Finder } from "./finder";

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthsWord(months: readonly number[]): string {
  if (!months.length) return "Any month";
  const runs: [number, number][] = [];
  for (const m of [...months].sort((a, b) => a - b)) {
    const last = runs.at(-1);
    if (last && last[1] === m - 1) last[1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? MONTH_SHORT[a - 1] : `${MONTH_SHORT[a - 1]}–${MONTH_SHORT[b - 1]}`)).join(", ");
}

export function nightsWord(nights: Finder["nights"]): string {
  if (!nights) return "Any length";
  const { min, max } = nights;
  if (max >= NIGHTS_SCALE.max) return `${min}+ nights`;
  if (min <= NIGHTS_SCALE.min) return `Up to ${max} nights`;
  return min === max ? `${min} nights` : `${min} to ${max} nights`;
}

const pounds = (n: number) => `£${n.toLocaleString("en-GB")}`;
const per = (price: Finder["price"]) => (price.unit === "night" ? " a night" : "");

export function priceWord(price: Finder["price"]): string {
  const { min, max } = price;
  if (min === null && max === null) return "Any price";
  if (min === null) return `Up to ${pounds(max as number)}${per(price)}`;
  if (max === null) return `From ${pounds(min)}${per(price)}`;
  return `${pounds(min)}–${pounds(max)}${per(price)}`;
}

/** The two ends of the price slider: "£0 – £5,000+". */
export function scaleWord(price: Finder["price"]): string {
  const top = price.max === null ? `${pounds(PRICE_SCALE[price.unit].max)}+` : pounds(price.max);
  return `${pounds(price.min ?? 0)} – ${top}${per(price)}`;
}

export type FinderPill = { id: string; label: string; clear: Finder };

/** Each must-have that is set, as a pill: what it says and the finder without it. */
export function finderPills(f: Finder): FinderPill[] {
  const out: FinderPill[] = [];
  if (f.q.trim()) out.push({ id: "q", label: `“${f.q.trim()}”`, clear: { ...f, q: "" } });
  for (const r of f.regions) out.push({ id: `region-${r}`, label: r, clear: { ...f, regions: f.regions.filter((x) => x !== r) } });
  if (f.months.length) out.push({ id: "months", label: monthsWord(f.months), clear: { ...f, months: [] } });
  if (f.nights) out.push({ id: "nights", label: nightsWord(f.nights), clear: { ...f, nights: null } });
  if (f.price.min !== null || f.price.max !== null) {
    out.push({ id: "price", label: priceWord(f.price), clear: { ...f, price: { unit: f.price.unit, min: null, max: null } } });
  }
  return out;
}

/**
 * What is left to sort on a trip, for the person reading (#460). Read from the data (rule 4): nothing is
 * stored, and a gap closes the moment the data that fills it lands.
 */
import { formatDate, formatShortRange, type IsoDate } from "../../dates/dates";
import type { DatesMoment } from "../../dates/dates-moment";
import { nightsLabel } from "../../itinerary/stops";
import type { Currency } from "../../money/currency";
import { formatMoney } from "../../money/money";

export type GapTab = "dates" | "ideas" | "money" | "packing" | "overview" | "days";

/** What a check is about, so a surface can draw its icon. */
export type GapKind = "days" | "ideas" | "money" | "packing" | "stay" | "travel";

export type Gap = {
  key: string;
  kind: GapKind;
  /** The viewer's own to do; these lead within a step. */
  mine: boolean;
  text: string;
  /** Parts, not one string: a list lines each part up under the one above. */
  sub?: string[];
  tab: GapTab;
  /** Where on the page, when the page is long. */
  anchor?: string;
  action: string;
};

export type LeftToSortInput = {
  moment: DatesMoment;
  today: IsoDate;
  viewerId: string;
  members: { userId: string; name: string }[];
  markedUserIds: string[];
  ideas: { mine: boolean }[];
  /** What the viewer owes, one row per person and currency. */
  owe: { to: string; amountMinor: number; currency: Currency }[];
  shared: { label: string; claimed: boolean }[];
  legs: { no: number; placeName: string; arrive: IsoDate; leave: IsoDate; nights: number; hasStay: boolean; hasTravel: boolean }[];
};

/** Something already sorted, in words, for the list behind the sorted count. */
export type Sorted = { key: string; kind: GapKind; text: string; sub?: string[] };

/** One thing Floc checks. An open check with no gap of its own counts towards the meter but shares a line. */
type Check = { done: true; item: Sorted } | { done: false; gap?: Gap };

const check = (done: boolean, item: Sorted, gap: Gap): Check => (done ? { done, item } : { done, gap });

const names = (list: string[]): string =>
  list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
const city = (place: string): string => place.split(",")[0];

function dateChecks(input: LeftToSortInput): Check[] {
  if (input.moment !== "finding") return [];
  const marked = new Set(input.markedUserIds);
  const others = input.members.filter((m) => m.userId !== input.viewerId && !marked.has(m.userId)).map((m) => m.name);
  const checks: Check[] = [
    check(marked.has(input.viewerId), { key: "my-days", kind: "days", text: "You marked your days" },
      { key: "my-days", kind: "days", mine: true, text: "Mark the days you can do", tab: "dates", action: "Mark my days" }),
    check(others.length === 0, { key: "their-days", kind: "days", text: "Everyone has marked their days" },
      { key: "their-days", kind: "days", mine: false, text: `${names(others)} ${others.length === 1 ? "has" : "have"} not marked any days`, tab: "dates", action: "Nudge" }),
  ];
  if (input.ideas.length > 0) {
    const n = input.ideas.length;
    const text = `Vote on where: ${n} ${n === 1 ? "idea" : "ideas"}`;
    checks.push(check(input.ideas.some((i) => i.mine), { key: "vote", kind: "ideas", text: "You voted on where" }, { key: "vote", kind: "ideas", mine: true, text, tab: "ideas", action: "Vote" }));
  }
  return checks;
}

function moneyChecks(input: LeftToSortInput): Check[] {
  return input.owe.map((o) => ({
    done: false,
    gap: { key: `owe-${o.to}-${o.currency}`, kind: "money", mine: true, text: `You owe ${o.to} ${formatMoney(o.amountMinor, o.currency)}`, tab: "money", action: "Settle up" },
  }));
}

function packingChecks(input: LeftToSortInput): Check[] {
  const free = input.shared.filter((s) => !s.claimed).map((s) => s.label);
  const claimed: Check[] = input.shared
    .filter((s) => s.claimed)
    .map((s) => ({ done: true, item: { key: `packing-${s.label}`, kind: "packing", text: s.label, sub: ["Someone is bringing it"] } }));
  if (free.length === 0) return claimed;
  const text = free.length === 1 ? `${free[0]} is up for grabs` : `${free.length} things are up for grabs`;
  const gap: Gap = { key: "packing", kind: "packing", mine: false, text, tab: "packing", action: "Bring something", ...(free.length > 1 ? { sub: [free.join(", ")] } : {}) };
  return [...claimed, { done: false, gap }, ...free.slice(1).map((): Check => ({ done: false }))];
}

function legChecks(input: LeftToSortInput): Check[] {
  const ahead = input.legs.filter((l) => l.arrive >= input.today);
  const stays = input.moment === "set"
    ? ahead.map((l) => {
        const sub = [nightsLabel(l.nights), formatShortRange(l.arrive, l.leave)];
        return check(l.hasStay, { key: `stay-${l.no}`, kind: "stay", text: `Stay booked in ${city(l.placeName)}`, sub },
          { key: `stay-${l.no}`, kind: "stay", mine: false, text: `No stay booked in ${city(l.placeName)}`, sub, tab: "overview", anchor: `stop-${l.no}`, action: "Find a stay" });
      })
    : [];
  const travel = ahead.flatMap((l) => {
    const from = input.legs.find((x) => x.no === l.no - 1);
    if (!from) return [];
    const hop = `${city(from.placeName)} to ${city(l.placeName)}`;
    return [check(l.hasTravel, { key: `travel-${l.no}`, kind: "travel", text: `${hop}: travel set`, sub: [formatDate(l.arrive)] },
      { key: `travel-${l.no}`, kind: "travel", mine: false, text: `${hop}: no travel set`, sub: [formatDate(l.arrive)], tab: "days", action: "Set travel" })];
  });
  return [...stays, ...travel];
}

export type LeftToSort = {
  /** One line each; a few checks can share a line. */
  open: Gap[];
  /** How many checks are open, for the meter. */
  left: number;
  done: Sorted[];
};

/** The order a trip gets planned in: dates, then booking, packing, money, and anything else. */
const STEP: Record<GapKind, number> = { days: 0, stay: 1, travel: 1, packing: 2, money: 3, ideas: 4 };

const byStep = (a: Gap, b: Gap) => STEP[a.kind] - STEP[b.kind] || Number(b.mine) - Number(a.mine);

export function leftToSort(input: LeftToSortInput): LeftToSort {
  const checks = [...dateChecks(input), ...legChecks(input), ...packingChecks(input), ...moneyChecks(input)];
  const open = checks.flatMap((c) => (!c.done && c.gap ? [c.gap] : []));
  return {
    open: [...open].sort(byStep),
    left: checks.filter((c) => !c.done).length,
    done: checks.flatMap((c) => (c.done ? [c.item] : [])),
  };
}

/** Columns for the meter's cubes: one row up to 12, then two, so a long trip's strip stays one line tall. */
export const cubeColumns = (total: number): number => (total > 12 ? Math.ceil(total / 2) : total);

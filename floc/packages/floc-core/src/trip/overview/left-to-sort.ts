/**
 * What is left to sort on a trip, for the person reading (#460). Read from the data (rule 4): nothing is
 * stored, and a gap closes the moment the data that fills it lands.
 */
import { formatDate, formatDateRange, type IsoDate } from "../../dates/dates";
import type { DatesMoment } from "../../dates/dates-moment";
import { nightsLabel } from "../../itinerary/stops";
import type { Currency } from "../../money/currency";
import { formatMoney } from "../../money/money";

export type GapTab = "dates" | "ideas" | "money" | "packing" | "overview" | "days";

export type Gap = {
  key: string;
  /** The viewer's own to do; these lead. */
  mine: boolean;
  text: string;
  sub?: string;
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

/** One thing Floc checks. A check with no gap of its own counts towards the meter but shares a line. */
type Check = { done: boolean; gap?: Gap };

const names = (list: string[]): string =>
  list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
const city = (place: string): string => place.split(",")[0];

function dateChecks(input: LeftToSortInput): Check[] {
  if (input.moment !== "finding") return [];
  const marked = new Set(input.markedUserIds);
  const others = input.members.filter((m) => m.userId !== input.viewerId && !marked.has(m.userId)).map((m) => m.name);
  const checks: Check[] = [
    { done: marked.has(input.viewerId), gap: { key: "my-days", mine: true, text: "Mark the days you can do", tab: "dates", action: "Mark my days" } },
    { done: others.length === 0, gap: { key: "their-days", mine: false, text: `${names(others)} ${others.length === 1 ? "has" : "have"} not marked any days`, tab: "dates", action: "Nudge" } },
  ];
  if (input.ideas.length > 0) {
    const n = input.ideas.length;
    const text = `Vote on where: ${n} ${n === 1 ? "idea" : "ideas"}`;
    checks.push({ done: input.ideas.some((i) => i.mine), gap: { key: "vote", mine: true, text, tab: "ideas", action: "Vote" } });
  }
  return checks;
}

function moneyChecks(input: LeftToSortInput): Check[] {
  return input.owe.map((o) => ({
    done: false,
    gap: { key: `owe-${o.to}-${o.currency}`, mine: true, text: `You owe ${o.to} ${formatMoney(o.amountMinor, o.currency)}`, tab: "money", action: "Settle up" },
  }));
}

function packingChecks(input: LeftToSortInput): Check[] {
  const free = input.shared.filter((s) => !s.claimed).map((s) => s.label);
  const claimed: Check[] = input.shared.filter((s) => s.claimed).map(() => ({ done: true }));
  if (free.length === 0) return claimed;
  const text = free.length === 1 ? `${free[0]} is up for grabs` : `${free.length} things are up for grabs`;
  const gap: Gap = { key: "packing", mine: false, text, tab: "packing", action: "Bring something", ...(free.length > 1 ? { sub: free.join(", ") } : {}) };
  return [...claimed, { done: false, gap }, ...free.slice(1).map(() => ({ done: false }))];
}

function legChecks(input: LeftToSortInput): Check[] {
  const ahead = input.legs.filter((l) => l.arrive >= input.today);
  const stays = input.moment === "set"
    ? ahead.map((l) => ({
        done: l.hasStay,
        gap: { key: `stay-${l.no}`, mine: false, text: `No stay booked in ${city(l.placeName)}`, sub: `${formatDateRange(l.arrive, l.leave)} · ${nightsLabel(l.nights)}`, tab: "overview" as const, anchor: `stop-${l.no}`, action: "Find a stay" },
      }))
    : [];
  const travel = ahead.flatMap((l) => {
    const from = input.legs.find((x) => x.no === l.no - 1);
    if (!from) return [];
    return [{ done: l.hasTravel, gap: { key: `travel-${l.no}`, mine: false, text: `${city(from.placeName)} to ${city(l.placeName)}: no travel set`, sub: formatDate(l.arrive), tab: "days" as const, action: "Set travel" } }];
  });
  return [...stays, ...travel];
}

export function leftToSort(input: LeftToSortInput): { open: Gap[]; sorted: number } {
  const checks = [...dateChecks(input), ...moneyChecks(input), ...packingChecks(input), ...legChecks(input)];
  const open = checks.flatMap((c) => (!c.done && c.gap ? [c.gap] : []));
  return {
    open: [...open.filter((g) => g.mine), ...open.filter((g) => !g.mine)],
    sorted: checks.filter((c) => c.done).length,
  };
}

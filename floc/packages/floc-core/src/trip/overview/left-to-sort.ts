import { formatDate, formatShortRange, type IsoDate } from "../../dates/dates";
import type { DatesMoment } from "../../dates/dates-moment";
import { nightsLabel } from "../../itinerary/stops";
import type { Currency } from "../../money/currency";
import { formatMoney } from "../../money/money";
import { shortPlace } from "../../itinerary/names/place-name";
import { countWord } from "../../text/count-word";
import { nudgeLine, type NudgePerson, type NudgeTargets, type NudgeTask } from "../nudge/nudge";

export type GapTab = "dates" | "money" | "packing" | "overview" | "days";

export type GapNudge = { task: NudgeTask; people: NudgePerson[]; line: string };

export type GapKind = "days" | "ideas" | "money" | "packing" | "stay" | "travel";

export type Gap = {
  key: string;
  kind: GapKind;
  mine: boolean;
  text: string;
  sub?: string[];
  tab: GapTab;
  anchor?: string;
  action: string;
  nudge?: GapNudge;
};

export type LeftToSortInput = {
  moment: DatesMoment;
  today: IsoDate;
  viewerId: string;
  members: { userId: string; name: string }[];
  markedUserIds: string[];
  ideas: { mine: boolean }[];
  owe: { to: string; amountMinor: number; currency: Currency }[];
  shared: { label: string; claimed: boolean }[];
  legs: { no: number; placeName: string; arrive: IsoDate; leave: IsoDate; nights: number; hasStay: boolean; hasTravel: boolean }[];
  nudges?: NudgeTargets;
};

export type Sorted = { key: string; kind: GapKind; text: string; sub?: string[] };

type Check = { done: true; item: Sorted } | { done: false; gap?: Gap };

const check = (done: boolean, item: Sorted, gap: Gap): Check => (done ? { done, item } : { done, gap });

const names = (list: string[]): string => {
  if (list.length > 3) return `${list.slice(0, 2).join(", ")} and ${list.length - 2} others`;
  return list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
};

const have = (n: number): string => (n === 1 ? "has" : "have");

const nudgeOf = (task: NudgeTask, people: NudgePerson[] | undefined): Pick<Gap, "action" | "nudge"> =>
  people?.length ? { action: "Nudge all", nudge: { task, people, line: nudgeLine(task, people.length) } } : { action: "Nudge" };

function voteChecks(input: LeftToSortInput): Check[] {
  if (input.ideas.length === 0) return [];
  const text = `Vote on where: ${countWord(input.ideas.length, "idea")}`;
  const checks = [check(input.ideas.some((i) => i.mine), { key: "vote", kind: "ideas", text: "You voted on where" }, { key: "vote", kind: "ideas", mine: true, text, tab: "overview", anchor: "ideas", action: "Vote" })];
  const late = input.nudges?.ideas;
  if (!late) return checks;
  const gap: Gap = { key: "their-votes", kind: "ideas", mine: false, text: `${names(late.map((p) => p.name))} ${have(late.length)} not voted on where`, tab: "overview", anchor: "ideas", ...nudgeOf("ideas", late) };
  return [...checks, check(late.length === 0, { key: "their-votes", kind: "ideas", text: "Everyone has voted on where" }, gap)];
}

function dateChecks(input: LeftToSortInput): Check[] {
  if (input.moment !== "finding") return [];
  const marked = new Set(input.markedUserIds);
  const others = input.members.filter((m) => m.userId !== input.viewerId && !marked.has(m.userId)).map((m) => m.name);
  return [
    check(marked.has(input.viewerId), { key: "my-days", kind: "days", text: "You marked your days" },
      { key: "my-days", kind: "days", mine: true, text: "Mark the days you can do", tab: "dates", action: "Mark my days" }),
    check(others.length === 0, { key: "their-days", kind: "days", text: "Everyone has marked their days" },
      { key: "their-days", kind: "days", mine: false, text: `${names(others)} ${have(others.length)} not marked any days`, tab: "dates", ...nudgeOf("dates", input.nudges?.dates) }),
    ...voteChecks(input),
  ];
}

function moneyChecks(input: LeftToSortInput): Check[] {
  const owe: Check[] = input.owe.map((o) => ({
    done: false,
    gap: { key: `owe-${o.to}-${o.currency}`, kind: "money", mine: true, text: `You owe ${o.to} ${formatMoney(o.amountMinor, o.currency)}`, tab: "money", action: "Settle up" },
  }));
  const owing = input.nudges?.money ?? [];
  if (owing.length === 0) return owe;
  const text = `${names(owing.map((p) => p.name))} ${owing.length === 1 ? "owes" : "owe"} you`;
  return [...owe, { done: false, gap: { key: "owed", kind: "money", mine: false, text, tab: "money", ...nudgeOf("money", owing) } }];
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
        return check(l.hasStay, { key: `stay-${l.no}`, kind: "stay", text: `Stay booked in ${shortPlace(l.placeName)}`, sub },
          { key: `stay-${l.no}`, kind: "stay", mine: false, text: `No stay booked in ${shortPlace(l.placeName)}`, sub, tab: "overview", anchor: `stop-${l.no}`, action: "Find a stay" });
      })
    : [];
  const travel = ahead.flatMap((l) => {
    const from = input.legs.find((x) => x.no === l.no - 1);
    if (!from) return [];
    const hop = `${shortPlace(from.placeName)} to ${shortPlace(l.placeName)}`;
    return [check(l.hasTravel, { key: `travel-${l.no}`, kind: "travel", text: `${hop}: travel set`, sub: [formatDate(l.arrive)] },
      { key: `travel-${l.no}`, kind: "travel", mine: false, text: `${hop}: no travel set`, sub: [formatDate(l.arrive)], tab: "days", action: "Set travel" })];
  });
  return [...stays, ...travel];
}

export type LeftToSort = {
  open: Gap[];
  left: number;
  done: Sorted[];
};

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

export const cubeColumns = (total: number): number => (total > 12 ? Math.ceil(total / 2) : total);

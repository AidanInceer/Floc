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

export type GapKind = "days" | "ideas" | "money" | "packing" | "plan" | "stay" | "travel";

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

export type ToDoLeg = { no: number; placeName: string; arrive: IsoDate; leave: IsoDate; nights: number; hasStay: boolean; hasTravel: boolean };

export type ToDoInput = {
  moment: DatesMoment;
  today: IsoDate;
  over: boolean;
  viewerId: string;
  members: { userId: string; name: string }[];
  markedUserIds: string[];
  ideas: { mine: boolean }[];
  owe: { to: string; amountMinor: number; currency: Currency }[];
  bag: { total: number; packed: number } | null;
  shared: { label: string; claimed: boolean }[];
  legs: ToDoLeg[];
  nudges?: NudgeTargets;
};

export type Sorted = { key: string; kind: GapKind; text: string; sub?: string[] };

type Check = { done: true; item: Sorted } | { done: false; gap?: Gap };

const check = (done: boolean, item: Sorted, gap: Gap): Check => (done ? { done, item } : { done, gap });

const open = (gap: Gap): Check => ({ done: false, gap });

const names = (list: string[]): string => {
  if (list.length > 3) return `${list.slice(0, 2).join(", ")} and ${list.length - 2} others`;
  return list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
};

const have = (n: number): string => (n === 1 ? "has" : "have");

const nudgeOf = (task: NudgeTask, people: NudgePerson[] | undefined): Pick<Gap, "action" | "nudge"> =>
  people?.length ? { action: "Nudge all", nudge: { task, people, line: nudgeLine(task, people.length) } } : { action: "Nudge" };

const travelsAlone = (input: ToDoInput): boolean => input.members.every((m) => m.userId === input.viewerId);

const NOWHERE = "Nowhere picked yet";

function whereChecks(input: ToDoInput): Check[] {
  if (input.legs.length > 0) return [];
  if (input.moment === "finding" && input.ideas.length === 0) {
    return [open({ key: "where", kind: "ideas", mine: true, text: NOWHERE, tab: "overview", anchor: "ideas", action: "Add an idea" })];
  }
  if (input.moment === "set") {
    return [open({ key: "where", kind: "plan", mine: true, text: NOWHERE, tab: "days", action: "Plan the days" })];
  }
  return [];
}

function voteChecks(input: ToDoInput): Check[] {
  if (input.ideas.length === 0) return [];
  const text = `Vote on where: ${countWord(input.ideas.length, "idea")}`;
  const checks = [check(input.ideas.some((i) => i.mine), { key: "vote", kind: "ideas", text: "You voted on where" }, { key: "vote", kind: "ideas", mine: true, text, tab: "overview", anchor: "ideas", action: "Vote" })];
  const late = input.nudges?.ideas;
  if (!late || travelsAlone(input)) return checks;
  const gap: Gap = { key: "their-votes", kind: "ideas", mine: false, text: `${names(late.map((p) => p.name))} ${have(late.length)} not voted on where`, tab: "overview", anchor: "ideas", ...nudgeOf("ideas", late) };
  return [...checks, check(late.length === 0, { key: "their-votes", kind: "ideas", text: "Everyone has voted on where" }, gap)];
}

function dateChecks(input: ToDoInput): Check[] {
  if (input.moment !== "finding") return [];
  const marked = new Set(input.markedUserIds);
  const others = input.members.filter((m) => m.userId !== input.viewerId && !marked.has(m.userId)).map((m) => m.name);
  const mine = check(marked.has(input.viewerId), { key: "my-days", kind: "days", text: "You marked your days" },
    { key: "my-days", kind: "days", mine: true, text: "Mark the days you can do", tab: "dates", action: "Mark my days" });
  const theirs = check(others.length === 0, { key: "their-days", kind: "days", text: "Everyone has marked their days" },
    { key: "their-days", kind: "days", mine: false, text: `${names(others)} ${have(others.length)} not marked any days`, tab: "dates", ...nudgeOf("dates", input.nudges?.dates) });
  const setDates = open({ key: "set-dates", kind: "days", mine: true, text: "The trip has no dates yet", tab: "dates", action: "Set the dates" });
  return [...voteChecks(input), ...(travelsAlone(input) ? [] : [mine, theirs]), setDates];
}

const FIND_A_STAY = { tab: "dates", anchor: "booking", action: "Find a stay" } as const;

function stayCheck(l: ToDoLeg): Check {
  const sub = [nightsLabel(l.nights), formatShortRange(l.arrive, l.leave)];
  return check(l.hasStay, { key: `stay-${l.no}`, kind: "stay", text: `Stay booked in ${shortPlace(l.placeName)}`, sub },
    { key: `stay-${l.no}`, kind: "stay", mine: false, text: `No stay booked in ${shortPlace(l.placeName)}`, sub, ...FIND_A_STAY });
}

function travelChecks(input: ToDoInput, ahead: ToDoLeg[]): Check[] {
  return ahead.flatMap((l) => {
    const from = input.legs.find((x) => x.no === l.no - 1);
    if (!from) return [];
    const hop = `${shortPlace(from.placeName)} to ${shortPlace(l.placeName)}`;
    return [check(l.hasTravel, { key: `travel-${l.no}`, kind: "travel", text: `${hop}: travel set`, sub: [formatDate(l.arrive)] },
      { key: `travel-${l.no}`, kind: "travel", mine: false, text: `${hop}: no travel set`, sub: [formatDate(l.arrive)], tab: "days", action: "Set travel" })];
  });
}

function legChecks(input: ToDoInput): Check[] {
  const ahead = input.legs.filter((l) => l.arrive >= input.today);
  const travel = travelChecks(input, ahead);
  if (input.moment !== "set") return travel;
  const fresh = ahead.length > 1 && ahead.every((l) => !l.hasStay);
  if (!fresh) return [...ahead.map(stayCheck), ...travel];
  const hops = travel.filter((c) => !c.done).length;
  const book = open({ key: "book-stops", kind: "stay", mine: false, text: `${countWord(ahead.length, "stop")} to book`, ...(hops ? { sub: [`${countWord(hops, "hop")} with no travel`] } : {}), ...FIND_A_STAY });
  const counted = (c: Check): Check => (c.done ? c : { done: false });
  return [book, ...ahead.slice(1).map((): Check => ({ done: false })), ...travel.map(counted)];
}

function bagChecks(input: ToDoInput): Check[] {
  const { bag } = input;
  if (!bag || input.over) return [];
  if (bag.total === 0) {
    return input.moment === "finding" ? [] : [open({ key: "bag", kind: "packing", mine: true, text: "Nothing on your packing list", tab: "packing", action: "Start my list" })];
  }
  const left = bag.total - bag.packed;
  return [check(left === 0, { key: "bag", kind: "packing", text: "Your bag is packed" },
    { key: "bag", kind: "packing", mine: true, text: `${countWord(left, "thing")} left to pack`, tab: "packing", action: "Pack" })];
}

function sharedChecks(input: ToDoInput): Check[] {
  if (input.over) return [];
  const free = input.shared.filter((s) => !s.claimed).map((s) => s.label);
  const claimed: Check[] = input.shared
    .filter((s) => s.claimed)
    .map((s) => ({ done: true, item: { key: `packing-${s.label}`, kind: "packing", text: s.label, sub: ["Someone is bringing it"] } }));
  if (free.length === 0) return claimed;
  const gap: Gap = { key: "packing", kind: "packing", mine: false, text: `${countWord(free.length, "shared thing")} to bring`, tab: "packing", action: "Bring" };
  return [...claimed, open(gap), ...free.slice(1).map((): Check => ({ done: false }))];
}

function moneyChecks(input: ToDoInput): Check[] {
  const owe: Check[] = input.owe.map((o) =>
    open({ key: `owe-${o.to}-${o.currency}`, kind: "money", mine: true, text: `You owe ${o.to} ${formatMoney(o.amountMinor, o.currency)}`, tab: "money", action: "Settle up" }),
  );
  const owing = input.nudges?.money ?? [];
  if (owing.length === 0) return owe;
  const text = `${names(owing.map((p) => p.name))} ${owing.length === 1 ? "owes" : "owe"} you`;
  return [...owe, open({ key: "owed", kind: "money", mine: false, text, tab: "money", ...nudgeOf("money", owing) })];
}

export type ToDoList = {
  open: Gap[];
  left: number;
  done: Sorted[];
};

export function toDoList(input: ToDoInput): ToDoList {
  const checks = [...whereChecks(input), ...dateChecks(input), ...legChecks(input), ...bagChecks(input), ...sharedChecks(input), ...moneyChecks(input)];
  return {
    open: checks.flatMap((c) => (!c.done && c.gap ? [c.gap] : [])),
    left: checks.filter((c) => !c.done).length,
    done: checks.flatMap((c) => (c.done ? [c.item] : [])),
  };
}

export const cubeColumns = (total: number): number => (total > 12 ? Math.ceil(total / 2) : total);

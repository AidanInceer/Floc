/**
 * The first-trip walkthrough (wireframe/trip-onboarding E5c): a person says what is already sorted,
 * and gets the one step to start on. It replaced the seven-stop spotlight tour (#315), which showed
 * every tab and asked nothing. Both clients draw it; neither decides it. The answers are guidance
 * only and are never stored.
 */
export type Sorted = { where: boolean; who: boolean; when: boolean };

export type WalkthroughStepKey = "ideas" | "invite" | "dates" | "days" | "book";

export type WalkthroughStep = {
  key: WalkthroughStepKey;
  title: string;
  line: string;
  /** Where its button goes, as the button says it: "Go to {place}". */
  place: string;
};

export const SORTED_CHIPS: { key: keyof Sorted; label: string }[] = [
  { key: "where", label: "Where we're going" },
  { key: "who", label: "It's just me" },
  { key: "when", label: "Our dates" },
];

/** Someone who joined was invited already, so who is not theirs to answer. */
export function chipsFor(joined: boolean): typeof SORTED_CHIPS {
  return joined ? SORTED_CHIPS.filter((c) => c.key !== "who") : SORTED_CHIPS;
}

/** The chips start from what the trip already holds: it never asks what the data answers (rule 4). */
export function sortedAtStart(input: { datesSet: boolean; placesSet: boolean; joined: boolean }): Sorted {
  return { where: input.placesSet, who: input.joined, when: input.datesSet };
}

/** A person's first trip only — never for someone already on another, never twice (#314). */
export function shouldStartWalkthrough(input: { seen: boolean; tripCount: number }): boolean {
  return !input.seen && input.tripCount <= 1;
}

const IDEAS: WalkthroughStep = { key: "ideas", title: "Pin some ideas", line: "Everyone adds places. Most votes wins.", place: "Ideas" };
const INVITE: WalkthroughStep = { key: "invite", title: "Get everyone in", line: "One link. They join and plan with you.", place: "the invite" };
const FIND_DATES: WalkthroughStep = { key: "dates", title: "Find a week that works", line: "Everyone marks their free days. Floc finds the best fit.", place: "Dates" };
const SET_DATES: WalkthroughStep = { key: "dates", title: "Check your dates", line: "Set them once. Days lays itself out.", place: "Dates" };
const DAYS: WalkthroughStep = { key: "days", title: "Fill in the days", line: "Where you sleep, what you do.", place: "Days" };
const BOOK: WalkthroughStep = { key: "book", title: "Book it, file it", line: "Booking links for each stop. Confirmations in Files.", place: "Files" };

/** What is left, in the order a trip comes together. Someone who joined was invited, so has no invite to send first. */
export function walkthroughSteps(sorted: Sorted, joined: boolean): WalkthroughStep[] {
  const steps: WalkthroughStep[] = [];
  if (!sorted.where) steps.push(IDEAS);
  if (!joined && !sorted.who) steps.push(INVITE);
  steps.push(sorted.when ? SET_DATES : FIND_DATES, DAYS, BOOK);
  return steps;
}

/** The line under the welcome. A trip name may end in its own full stop, so it never gets a second. */
export function welcomeLine(tripName: string, joined: boolean): string {
  const name = tripName.trim().replace(/[.!?]+$/, "");
  const end = tripName.trim().match(/[.!?]+$/)?.[0] ?? ".";
  return `${joined ? `You're in on ${name}` : `Let's get ${name} off the ground`}${end} What's sorted already?`;
}

/** The steps after the first, as one sentence. */
export function thenLine(steps: WalkthroughStep[]): string {
  const rest = steps.slice(1);
  if (rest.length === 0) return "";
  return `Then ${rest.map((s) => s.title.toLowerCase()).join(", ")}.`;
}

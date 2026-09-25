import { whoTone } from "../../people/who";

export type LiveUser = { id: string; name: string; tone: string; color: string };
export type PresentPerson = { id: string; name: string; tone: string };

const FALLBACK_TONE = "who-8";

export function liveUser(person: { id: string; name: string }): LiveUser {
  // Why a fixed hex: y-prosemirror warns on anything but #rrggbb, and a real
  // colour cannot follow each viewer's theme. The tone class does the painting.
  return { id: person.id, name: person.name, tone: whoTone(person.name), color: "#000000" };
}

/** Another client's awareness is untrusted: its tone lands in a class name. */
export function cursorTone(user: object): string {
  const tone = (user as { tone?: unknown }).tone;
  return typeof tone === "string" && /^who-[1-8]$/.test(tone) ? tone : FALLBACK_TONE;
}

type Remote = { user?: Record<string, unknown>; page?: unknown } | null;

function person(state: unknown): PresentPerson | null {
  const user = (state as Remote)?.user;
  if (typeof user?.id !== "string" || typeof user.name !== "string") return null;
  return { id: user.id, name: user.name, tone: cursorTone(user) };
}

export function presentPeople(states: Map<number, unknown>): PresentPerson[] {
  const people = new Map<string, PresentPerson>();
  for (const state of states.values()) {
    const found = person(state);
    if (found && !people.has(found.id)) people.set(found.id, found);
  }
  return [...people.values()];
}

/** Who has which page open (#408), from the trip's page-list doc. Each person once per page. */
export function peopleByPage(states: Map<number, unknown>): Map<number, PresentPerson[]> {
  const byPage = new Map<number, PresentPerson[]>();
  for (const state of states.values()) {
    const found = person(state);
    const page = (state as Remote)?.page;
    if (!found || typeof page !== "number") continue;
    const here = byPage.get(page) ?? [];
    if (!here.some((other) => other.id === found.id)) byPage.set(page, [...here, found]);
  }
  return byPage;
}

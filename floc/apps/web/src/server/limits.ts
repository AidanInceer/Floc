import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { log } from "./observability/log";

export const LIMITS = {
  days: 366,
  eventsPerDay: 100,
  expenses: 2000,
  expenseSplits: 10_000,
  packingLines: 500,
  packingKits: 50,
  packingKitItems: 200,
  members: 100,
  tripsPerUser: 500,
  tripLinks: 200,
  invites: 200,
  documents: 500,
  ideas: 200,
  availability: 20_000,
  availabilityPerPerson: 732,
  lengthChoices: 1000,
  commentsPerThread: 500,
  nudgesPerDay: 20,
  friendGroups: 20,
  friendGroupMembers: 20,
  wishLists: 30,
  wishListMembers: 20,
  wishListItems: 200,
  mapLegs: 20,
} as const;

export type LimitKey = keyof typeof LIMITS;

export function reportCeiling(what: LimitKey, scope: string): void {
  log.warn("limit.ceiling", { limit: what, max: LIMITS[what], scope });
}

export function bounded<T>(rows: T[], what: LimitKey, scope: string): T[] {
  if (rows.length >= LIMITS[what]) reportCeiling(what, scope);
  return rows;
}

const FULL: Partial<Record<LimitKey, string>> = {
  days: "Keep a trip to a year or less.",
  eventsPerDay: "This day holds as many events as it can.",
  expenses: "This trip holds as many expenses as it can.",
  packingLines: "This list holds as many things as it can.",
  tripsPerUser: "You are on as many trips as Floc can hold. Leave or delete one first.",
  tripLinks: "This trip holds as many links as it can.",
  ideas: "This trip holds as many ideas as it can.",
  availabilityPerPerson: "That is more dates than one trip can hold.",
  commentsPerThread: "This thread holds as many comments as it can.",
  nudgesPerDay: "That is enough nudges for today. Try again tomorrow.",
  friendGroups: "You can keep 20 groups at most. Delete one first.",
  friendGroupMembers: "A group holds 20 people at most.",
  wishLists: "You can be on 30 wish lists at most. Leave one first.",
  wishListMembers: "A wish list holds 20 people at most.",
  wishListItems: "This wish list holds as many things as it can.",
};

export function assertRoom(what: LimitKey, current: number, adding = 1): void {
  if (current + adding > LIMITS[what]) throw new Refusal(FULL[what] ?? "That is as much as this trip can hold.");
}

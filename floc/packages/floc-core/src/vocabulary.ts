/**
 * The closed sets the domain rules branch on (#286). They were declared beside
 * their tables in `db/schema.ts`, which put a rule like `computeSplits` one import
 * away from the Drizzle client — fine while everything was one app, impossible
 * once a phone has to run the same rule. The tables still spell their columns
 * from these, so the schema keeps its say over storage; the values just live
 * where both surfaces can reach them.
 */

/** `none` is a rejection of a mark, not the absence of one (ticket 95). */
export const COUNTRY_MARK_STATES = ["green", "yellow", "none"] as const;
export type CountryMarkState = (typeof COUNTRY_MARK_STATES)[number];

/** The event's category — the one field the Days page colours by (ticket 68). Accommodation is the day's overnight place, not an event. */
export const DAY_EVENT_TYPES = ["activity", "transport", "food"] as const;
export type DayEventType = (typeof DAY_EVENT_TYPES)[number];

export const TRANSPORT_TYPES = [
  "flight",
  "train",
  "car",
  "ferry",
  "other",
] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const SPLIT_TYPES = ["even", "exact", "percentage", "shares"] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

/** Three, fixed, in render order. Independent of each other — a note can carry all three. */
export const REACTION_KINDS = ["heart", "up", "down"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

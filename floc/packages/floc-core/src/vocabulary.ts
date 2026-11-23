export const COUNTRY_MARK_STATES = ["green", "yellow", "none"] as const;
export type CountryMarkState = (typeof COUNTRY_MARK_STATES)[number];

export const DAY_EVENT_TYPES = ["activity", "transport", "food", "other"] as const;
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

export const REACTION_KINDS = ["heart", "up", "down"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

import type { Minor } from "./money";

export type Vote = "up" | "meh" | "block";
export type Free = "y" | "m" | "n";

export type Member = {
  id: string;
  name: string;
  initials: string;
  /** 1–6, mapped to the six ink colours in the stylesheet. */
  pen: 1 | 2 | 3 | 4 | 5 | 6;
  /** A link guest has voted but never made an account (ADR 0008). */
  guest?: boolean;
};

export type Idea = {
  id: string;
  name: string;
  byId: string;
  estMinor?: Minor;
  detail?: string;
  votes: Record<string, Vote>;
  /** A block is cheap but must be explained (ADR 0010). */
  blockReasons: Record<string, string>;
  rejected?: boolean;
};

export type Week = { id: string; label: string };

export type Leg = { mode: "van" | "ferry" | "foot" | "train" | "plane"; time: string; detail: string };

export type Stop = {
  id: string;
  name: string;
  nights: number;
  detail: string;
  booked: boolean;
  /** Position on the sketch map, 0–100 in both axes. */
  x: number;
  y: number;
  legIn?: Leg;
};

export type Note = { id: string; byId: string; when: string; text: string; tone?: "urgent" };

export type Event = {
  id: string;
  time: string;
  title: string;
  body?: string;
  optional?: boolean;
  tags?: string[];
  notes: Note[];
};

export type Day = {
  id: string;
  date: string;
  short: string;
  label: string;
  headline: string;
  meta: string;
  events: Event[];
};

export type Expense = {
  id: string;
  what: string;
  payerId: string;
  amountMinor: Minor;
  /** Everyone this cost is split between, evenly. */
  shareIds: string[];
  when: string;
};

export type Phase = "deciding" | "dated" | "shaped" | "settled";

export type Trip = {
  id: string;
  title: string;
  blurb: string;
  when: string;
  phase: Phase;
  currency: string;
  members: Member[];
  ideas: Idea[];
  weeks: Week[];
  /** memberId → weekId → can / maybe / can't. Missing means unanswered. */
  availability: Record<string, Record<string, Free>>;
  lockedWeekId?: string;
  stops: Stop[];
  days: Day[];
  expenses: Expense[];
  notes: Note[];
  ground: string[];
  activity: { id: string; byId: string; text: string; when: string }[];
};

export type State = {
  /** The signed-in person. Everything "you" is resolved against this. */
  meId: string;
  trips: Trip[];
  nudged: string[];
};

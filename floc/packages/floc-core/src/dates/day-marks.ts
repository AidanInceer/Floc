/**
 * What colour a day on the Dates calendar is. One answer for every tab, so a day never
 * changes colour when you switch: the trip is solid green, everyone free pastel green,
 * some free pastel red in three steps by how many can do it.
 */

export type DayMark =
  | { kind: "none" }
  | { kind: "all" }
  | { kind: "some"; step: 1 | 2 | 3 }
  | { kind: "trip" }
  | { kind: "pend" };

export type DayMarkInput = {
  tally: number;
  memberCount: number;
  inTrip: boolean;
  /** A new window is being picked; it, not the stored trip, is drawn as the trip. */
  picking: boolean;
  inPick: boolean;
  /** Inside the span a second press would make. */
  pending: boolean;
};

/** Three steps whatever the group size, so ten people read the same as four. */
export function someFreeStep(tally: number, memberCount: number): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, Math.ceil((3 * tally) / memberCount))) as 1 | 2 | 3;
}

export function dayMark(d: DayMarkInput): DayMark {
  if (d.picking ? d.inPick : d.inTrip) return { kind: "trip" };
  if (d.picking && d.pending) return { kind: "pend" };
  if (d.tally === 0) return { kind: "none" };
  if (d.tally >= d.memberCount) return { kind: "all" };
  return { kind: "some", step: someFreeStep(d.tally, d.memberCount) };
}

/** Two days join only when this matches: some-free days of different steps stay apart. */
export function markKey(m: DayMark): string {
  if (m.kind === "none") return "";
  return m.kind === "some" ? `some-${m.step}` : m.kind;
}

/** For one week row: whether each day's shape runs into the day either side. */
export function weekJoins(keys: (string | null)[]): { left: boolean; right: boolean }[] {
  return keys.map((k, i) => ({
    left: !!k && i > 0 && keys[i - 1] === k,
    right: !!k && i < keys.length - 1 && keys[i + 1] === k,
  }));
}

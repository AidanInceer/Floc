export type DayMark =
  | { kind: "none" }
  | { kind: "all" }
  | { kind: "some"; step: 1 | 2 | 3 }
  | { kind: "trip" }
  | { kind: "pend" };

export type DayMarkInput = {
  tally: number;
  prefer?: number;
  answered?: number;
  memberCount: number;
  inTrip: boolean;
  picking: boolean;
  inPick: boolean;
  pending: boolean;
};

export function someFreeStep(tally: number, memberCount: number): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, Math.ceil((3 * tally) / memberCount))) as 1 | 2 | 3;
}

export function dayMark(d: DayMarkInput): DayMark {
  if (d.picking ? d.inPick : d.inTrip) return { kind: "trip" };
  if (d.picking && d.pending) return { kind: "pend" };
  if (d.tally === 0) return { kind: "none" };
  if (d.tally >= d.memberCount) return { kind: "all" };
  if (d.prefer === undefined) return { kind: "some", step: someFreeStep(d.tally, d.memberCount) };
  const answered = Math.max(d.answered ?? d.memberCount, d.tally);
  return { kind: "some", step: someFreeStep(d.tally + d.prefer, 2 * answered) };
}

export function markKey(m: DayMark): string {
  if (m.kind === "none") return "";
  return m.kind === "some" ? `some-${m.step}` : m.kind;
}

export function weekJoins(keys: (string | null)[]): { left: boolean; right: boolean }[] {
  return keys.map((k, i) => ({
    left: !!k && i > 0 && keys[i - 1] === k,
    right: !!k && i < keys.length - 1 && keys[i + 1] === k,
  }));
}

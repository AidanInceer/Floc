export type QuietDay = { dayId: number; date: string; count: number };

export type DayItem<D extends QuietDay> = { kind: "day"; day: D } | { kind: "quiet"; days: D[] };

const MIN_RUN = 3;

export function collapseQuiet<D extends QuietDay>(days: D[]): DayItem<D>[] {
  const out: DayItem<D>[] = [];
  let run: D[] = [];
  const flush = () => {
    if (run.length >= MIN_RUN) out.push({ kind: "quiet", days: run });
    else for (const day of run) out.push({ kind: "day", day });
    run = [];
  };
  for (const day of days) {
    if (day.count === 0) run.push(day);
    else {
      flush();
      out.push({ kind: "day", day });
    }
  }
  flush();
  return out;
}

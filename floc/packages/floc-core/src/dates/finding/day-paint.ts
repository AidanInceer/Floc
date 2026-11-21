export type PaintMark = "off" | "free" | "prefer";

export type PaintMode = "free" | "prefer";

export function pressTarget(now: PaintMark, mode: PaintMode): PaintMark {
  if (mode === "prefer") return now === "prefer" ? "free" : "prefer";
  return now === "off" ? "free" : "off";
}

export type PaintDiff = {
  add: string[];
  remove: string[];
  prefer: { on: string[]; off: string[] };
  changed: number;
  freed: Record<string, number>;
};

export function paintDiff(stored: (date: string) => PaintMark, edits: Record<string, PaintMark>): PaintDiff {
  const diff: PaintDiff = { add: [], remove: [], prefer: { on: [], off: [] }, changed: 0, freed: {} };
  for (const date of Object.keys(edits).sort((a, b) => a.localeCompare(b))) {
    const was = stored(date);
    const now = edits[date];
    if (was === now) continue;
    diff.changed += 1;
    if (now === "off") diff.remove.push(date);
    else if (now === "prefer") diff.prefer.on.push(date);
    else if (was === "prefer") diff.prefer.off.push(date);
    else diff.add.push(date);
    if ((was === "off") !== (now === "off")) diff.freed[date] = now === "off" ? -1 : 1;
  }
  return diff;
}

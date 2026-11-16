import type { PresetDay, PresetDayItem } from "./preset-detail-types";

const FREE = "~ ";
const HIGHLIGHT = "* ";

function item(line: string): PresetDayItem {
  const gap = line.indexOf(" ");
  const [time, rest] = [line.slice(0, gap), line.slice(gap + 1)];
  if (rest.startsWith(FREE)) return { time, text: rest.slice(FREE.length), free: true };
  if (rest.startsWith(HIGHLIGHT)) return { time, text: rest.slice(HIGHLIGHT.length), highlight: true };
  return { time, text: rest };
}

export function day(title: string, lines: string[], highlight?: string): PresetDay {
  const out: PresetDay = { title, items: lines.map(item) };
  if (highlight) out.highlight = highlight;
  return out;
}

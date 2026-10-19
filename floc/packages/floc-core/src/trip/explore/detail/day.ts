import type { PresetDay, PresetDayItem } from "./preset-detail-types";

const FREE = "~ ";

function item(line: string): PresetDayItem {
  const gap = line.indexOf(" ");
  const [time, rest] = [line.slice(0, gap), line.slice(gap + 1)];
  return rest.startsWith(FREE) ? { time, text: rest.slice(FREE.length), free: true } : { time, text: rest };
}

/**
 * One day of a listing's page, written as lines: "09:40 Romancecar from Shinjuku". A line whose text starts "~ " is time
 * left empty on purpose. `checkPresetDetail` still checks every time.
 */
export function day(title: string, lines: string[], highlight?: string): PresetDay {
  const out: PresetDay = { title, items: lines.map(item) };
  if (highlight) out.highlight = highlight;
  return out;
}

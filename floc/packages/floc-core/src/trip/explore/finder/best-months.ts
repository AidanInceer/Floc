const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const month = (word: string) => MONTHS.indexOf(word.trim().toLowerCase()) + 1;

/** "March to May, October" → [3, 4, 5, 10]. A range may wrap the year end. */
export function monthsOf(bestMonths: string): number[] {
  const found = new Set<number>();
  for (const part of bestMonths.split(",")) {
    const [from, to] = part.split(" to ").map(month);
    if (!from) continue;
    if (!to) {
      found.add(from);
      continue;
    }
    for (let m = from; ; m = (m % 12) + 1) {
      found.add(m);
      if (m === to) break;
    }
  }
  return [...found].sort((a, b) => a - b);
}

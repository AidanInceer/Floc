/**
 * What a page's lines show besides their text (#408): list numbers by depth
 * (1, a, i), bullet shapes, and which lines a folded heading hides. The
 * editor draws these; they are never stored.
 */
export type OutlineLine = { type: string; indent: number; level?: number; id?: string };

const roman = (n: number) => {
  let out = "";
  let left = n;
  for (const [value, numeral] of [[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]] as const) {
    while (left >= value) {
      out += numeral;
      left -= value;
    }
  }
  return out;
};

export function numberLabel(n: number, depth: number): string {
  if (depth % 3 === 1) return String.fromCharCode(96 + ((n - 1) % 26) + 1);
  if (depth % 3 === 2) return roman(n);
  return String(n);
}

/** The number each numbered line shows, or null. A deeper line keeps the count above it running. */
export function listNumbers(lines: readonly OutlineLine[]): (string | null)[] {
  const counters: number[] = [];
  return lines.map((line) => {
    if (line.type !== "numbered") {
      counters.length = Math.min(counters.length, line.indent);
      return null;
    }
    counters.length = line.indent + 1;
    const count = (counters[line.indent] ?? 0) + 1;
    counters[line.indent] = count;
    return `${numberLabel(count, line.indent)}.`;
  });
}

export type BulletShape = "dot" | "ring" | "square";
export const bulletShape = (indent: number): BulletShape => (["dot", "ring", "square"] as const)[indent % 3];

const headingLevel = (line: OutlineLine) => (line.type === "heading" ? (line.level ?? 3) : null);

/** The index after a heading's section: the next heading of the same or a higher level. */
export function sectionEnd(lines: readonly OutlineLine[], at: number): number {
  const level = headingLevel(lines[at]);
  if (level === null) return at + 1;
  let end = at + 1;
  while (end < lines.length) {
    const next = headingLevel(lines[end]);
    if (next !== null && next <= level) break;
    end += 1;
  }
  return end;
}

/** True for each line a folded heading above it hides. */
export function hiddenLines(lines: readonly OutlineLine[], folded: ReadonlySet<string>): boolean[] {
  const hidden = lines.map(() => false);
  let at = 0;
  while (at < lines.length) {
    const line = lines[at];
    if (line.type === "heading" && line.id && folded.has(line.id)) {
      const end = sectionEnd(lines, at);
      for (let i = at + 1; i < end; i += 1) hidden[i] = true;
      at = end;
    } else at += 1;
  }
  return hidden;
}

/** A heading shows its fold control only when there is something under it to hide. */
export const canFold = (lines: readonly OutlineLine[], at: number): boolean =>
  lines[at].type === "heading" && sectionEnd(lines, at) > at + 1;

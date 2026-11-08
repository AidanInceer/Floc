export type FigurePart = { text: string; figure: boolean };

const MARK = /\*\*(.+?)\*\*/g;
const NUMBER = /(?:[A-Z]*\$|[€£¥])?\d[\d,.:]*/g;

function markParts(marked: string): FigurePart[] {
  const parts: FigurePart[] = [];
  let at = 0;
  for (const m of marked.matchAll(NUMBER)) {
    if (m.index > at) parts.push({ text: marked.slice(at, m.index), figure: false });
    parts.push({ text: m[0], figure: true });
    at = m.index + m[0].length;
  }
  if (at < marked.length) parts.push({ text: marked.slice(at), figure: false });
  return parts;
}

/** Splits a tip's text on `**x**` marks. Inside a mark only the number tokens are figures, so `**30 days**` sets "30" in the figure face and " days" plain. */
export function figureParts(text: string): FigurePart[] {
  const parts: FigurePart[] = [];
  let at = 0;
  for (const m of text.matchAll(MARK)) {
    if (m.index > at) parts.push({ text: text.slice(at, m.index), figure: false });
    parts.push(...markParts(m[1]));
    at = m.index + m[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), figure: false });
  return parts;
}

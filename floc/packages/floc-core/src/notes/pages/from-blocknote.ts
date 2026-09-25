/**
 * The one-off move off BlockNote (#408): a trip's old Notes doc, as BlockNote
 * JSON, becomes its first page. Every word stays; what our format has no place
 * for (code styling, text colour, images) keeps its text or becomes a link.
 */
import { EMPTY_PAGE, MAX_INDENT, type Inline, type Mark, type PageBlock, type TableCell, type Tone } from "./page-blocks";

type Loose = Record<string, unknown>;
const isObject = (value: unknown): value is Loose => typeof value === "object" && value !== null;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const props = (block: Loose): Loose => (isObject(block.props) ? block.props : {});

const TONE_OF: Record<string, Tone> = {
  yellow: "butter",
  orange: "butter",
  brown: "butter",
  red: "blush",
  pink: "blush",
  green: "mint",
  blue: "peri",
  purple: "peri",
};

function styleMarks(styles: unknown): Mark[] {
  if (!isObject(styles)) return [];
  const marks: Mark[] = [];
  for (const type of ["bold", "italic", "underline", "strike"] as const) if (styles[type] === true) marks.push({ type });
  const tone = typeof styles.backgroundColor === "string" ? TONE_OF[styles.backgroundColor] : undefined;
  if (tone) marks.push({ type: "highlight", tone });
  return marks;
}

function run(text: string, marks: Mark[]): Inline {
  return marks.length ? { type: "text", text, marks } : { type: "text", text };
}

function inlines(content: unknown): Inline[] {
  if (typeof content === "string") return content ? [run(content, [])] : [];
  return list(content).flatMap((raw): Inline[] => {
    if (!isObject(raw)) return [];
    if (raw.type === "link") {
      const link: Mark[] = typeof raw.href === "string" ? [{ type: "link", href: raw.href }] : [];
      return inlines(raw.content).map((inner) => (inner.type === "text" ? run(inner.text, [...(inner.marks ?? []), ...link]) : inner));
    }
    return typeof raw.text === "string" && raw.text ? [run(raw.text, styleMarks(raw.styles))] : [];
  });
}

function cell(raw: unknown): TableCell {
  if (Array.isArray(raw)) return { tone: null, content: inlines(raw) };
  const block = isObject(raw) ? raw : {};
  const colour = props(block).backgroundColor;
  return { tone: (typeof colour === "string" ? TONE_OF[colour] : undefined) ?? null, content: inlines(block.content) };
}

function table(block: Loose): PageBlock | null {
  const content = isObject(block.content) ? block.content : {};
  const rows = list(content.rows).map((row) => list(isObject(row) ? row.cells : null).map(cell)).filter((row) => row.length > 0);
  if (!rows.length) return null;
  return { type: "table", header: typeof content.headerRows === "number" && content.headerRows > 0, rows };
}

function fileLink(block: Loose): PageBlock | null {
  const { url, caption, name } = props(block);
  if (typeof url !== "string" || !url) return null;
  const label = [caption, name].find((value): value is string => typeof value === "string" && value !== "") ?? url;
  return { type: "paragraph", indent: 0, content: [run(label, [{ type: "link", href: url }])] };
}

const PLAIN: Record<string, "paragraph" | "bullet" | "numbered" | "quote"> = {
  paragraph: "paragraph",
  bulletListItem: "bullet",
  toggleListItem: "bullet",
  numberedListItem: "numbered",
  quote: "quote",
};

function heading(block: Loose, indent: number, content: Inline[]): PageBlock {
  const level = props(block).level;
  return { type: "heading", id: typeof block.id === "string" ? block.id : "", level: level === 1 || level === 2 ? level : 3, indent, content };
}

function convert(block: Loose, indent: number): PageBlock | null {
  const type = typeof block.type === "string" ? block.type : "";
  const content = inlines(block.content);
  const plain = PLAIN[type];
  if (plain) return { type: plain, indent, content };
  switch (type) {
    case "heading":
      return heading(block, indent, content);
    case "checkListItem":
      return { type: "check", indent, checked: props(block).checked === true, content };
    case "divider":
    case "pageBreak":
      return { type: "divider" };
    case "table":
      return table(block);
    case "image":
    case "video":
    case "audio":
    case "file":
      return fileLink(block);
    default:
      return content.length ? { type: "paragraph", indent, content } : null;
  }
}

function walk(blocks: unknown, depth: number): PageBlock[] {
  return list(blocks).flatMap((raw) => {
    if (!isObject(raw)) return [];
    const made = convert(raw, Math.min(depth, MAX_INDENT));
    return [...(made ? [made] : []), ...walk(raw.children, depth + 1)];
  });
}

export function fromBlockNote(body: unknown): PageBlock[] {
  let parsed: unknown = null;
  try {
    parsed = typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    return EMPTY_PAGE;
  }
  const blocks = walk(parsed, 0);
  return blocks.length ? blocks : EMPTY_PAGE;
}

/** Every piece of text in a BlockNote doc, for checking a move lost none. */
export function blockNoteText(body: unknown): string[] {
  const out: string[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (isObject(value)) {
      if (typeof value.text === "string" && value.text.trim()) out.push(value.text);
      Object.values(value).forEach(visit);
    }
  };
  try {
    visit(typeof body === "string" ? JSON.parse(body) : body);
  } catch {
    return [];
  }
  return out;
}

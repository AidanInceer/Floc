/**
 * A notes page's own block format (#408, ADR-014): what `trip_page.body` holds
 * and what every reader outside the editor sees. Flat blocks with an indent,
 * not nested lists, so a line keeps its place when it moves in or out.
 */
import { isLinkKind, type LinkKind } from "./trip-links";
import { safeHref } from "../../text/safe-href";

export const TONES = ["butter", "blush", "mint", "peri"] as const;
export type Tone = (typeof TONES)[number];

export const MAX_INDENT = 3;

export type Mark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "link"; href: string }
  | { type: "highlight"; tone: Tone }
  | { type: "comment"; id: number };

/** A "\n" in `text` is a line break inside the block. */
export type TextRun = { type: "text"; text: string; marks?: Mark[] };
export type LinkRun = { type: "tripLink"; kind: LinkKind; id: number; label: string };
export type Inline = TextRun | LinkRun;

export type TextBlock =
  | { type: "paragraph" | "bullet" | "numbered" | "quote"; indent: number; content: Inline[] }
  | { type: "heading"; id: string; level: 1 | 2 | 3; indent: number; content: Inline[] }
  | { type: "check"; indent: number; checked: boolean; content: Inline[] };
export type TableCell = { tone: Tone | null; content: Inline[] };
export type TableBlock = { type: "table"; header: boolean; rows: TableCell[][] };
export type PageBlock = TextBlock | TableBlock | { type: "divider" };

export const EMPTY_PAGE: PageBlock[] = [{ type: "paragraph", indent: 0, content: [] }];

type Loose = Record<string, unknown>;
const isObject = (value: unknown): value is Loose => typeof value === "object" && value !== null;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const isTone = (value: unknown): value is Tone => typeof value === "string" && (TONES as readonly string[]).includes(value);

export function clampIndent(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.min(MAX_INDENT, Math.max(0, n));
}

function readMark(raw: unknown): Mark | null {
  if (!isObject(raw)) return null;
  switch (raw.type) {
    case "bold":
    case "italic":
    case "underline":
    case "strike":
      return { type: raw.type };
    case "link": {
      const href = typeof raw.href === "string" ? safeHref(raw.href) : null;
      return href ? { type: "link", href } : null;
    }
    case "highlight":
      return isTone(raw.tone) ? { type: "highlight", tone: raw.tone } : null;
    case "comment":
      return typeof raw.id === "number" && Number.isInteger(raw.id) ? { type: "comment", id: raw.id } : null;
    default:
      return null;
  }
}

function readInline(raw: unknown): Inline | null {
  if (!isObject(raw)) return null;
  if (raw.type === "text" && typeof raw.text === "string") {
    const marks = list(raw.marks).map(readMark).filter((mark): mark is Mark => mark !== null);
    return marks.length ? { type: "text", text: raw.text, marks } : { type: "text", text: raw.text };
  }
  if (raw.type === "tripLink" && isLinkKind(raw.kind) && typeof raw.id === "number" && raw.id > 0) {
    return { type: "tripLink", kind: raw.kind, id: raw.id, label: typeof raw.label === "string" ? raw.label : "" };
  }
  return null;
}

export const readInlines = (raw: unknown): Inline[] =>
  list(raw).map(readInline).filter((run): run is Inline => run !== null);

function readCell(raw: unknown): TableCell | null {
  if (!isObject(raw)) return null;
  return { tone: isTone(raw.tone) ? raw.tone : null, content: readInlines(raw.content) };
}

function readTable(raw: Loose): TableBlock | null {
  const rows = list(raw.rows)
    .filter(Array.isArray)
    .map((row) => row.map(readCell).filter((cell): cell is TableCell => cell !== null))
    .filter((row) => row.length > 0);
  return rows.length ? { type: "table", header: raw.header === true, rows } : null;
}

function readHeadingLevel(value: unknown): 1 | 2 | 3 {
  return value === 1 || value === 2 ? value : 3;
}

function readBlock(raw: unknown): PageBlock | null {
  if (!isObject(raw)) return null;
  const indent = clampIndent(raw.indent);
  const content = readInlines(raw.content);
  switch (raw.type) {
    case "paragraph":
    case "bullet":
    case "numbered":
    case "quote":
      return { type: raw.type, indent, content };
    case "heading":
      return { type: "heading", id: typeof raw.id === "string" ? raw.id : "", level: readHeadingLevel(raw.level), indent, content };
    case "check":
      return { type: "check", indent, checked: raw.checked === true, content };
    case "divider":
      return { type: "divider" };
    case "table":
      return readTable(raw);
    default:
      return null;
  }
}

/** A stored body, read without trusting it. Anything unreadable is an empty page, never a throw. */
export function parsePageBody(raw: unknown): PageBlock[] {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return EMPTY_PAGE;
    }
  }
  const blocks = isObject(parsed) ? list(parsed.blocks).map(readBlock).filter((block): block is PageBlock => block !== null) : [];
  return blocks.length ? blocks : EMPTY_PAGE;
}

export function serialisePage(blocks: readonly PageBlock[]): string {
  return JSON.stringify({ version: 1, blocks });
}

export function inlineText(content: readonly Inline[]): string {
  return content.map((run) => (run.type === "text" ? run.text : run.label)).join("");
}

/** A page's words, line by line, table cells included. */
export function pageText(blocks: readonly PageBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "divider") return "";
      if (block.type === "table") return block.rows.map((row) => row.map((cell) => inlineText(cell.content)).join("\t")).join("\n");
      return inlineText(block.content);
    })
    .join("\n");
}

/** A page of bullets, one per line — a preset trip's highlights. None is an empty page. */
export function bulletPage(lines: readonly string[]): PageBlock[] {
  return lines.length ? lines.map((text) => ({ type: "bullet", indent: 0, content: [{ type: "text", text }] })) : EMPTY_PAGE;
}

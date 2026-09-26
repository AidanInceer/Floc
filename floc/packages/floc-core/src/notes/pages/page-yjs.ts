/**
 * A notes page as the live Yjs doc holds it (#408). The shape is the editor's
 * ProseMirror tree as y-prosemirror stores it: one element per block, one
 * XmlText per run of text, marks as text attributes. The server reads and
 * seeds pages with this, so it never needs the editor.
 */
import * as Y from "yjs";

import { EMPTY_PAGE, clampIndent, isTone, type Inline, type Mark, type PageBlock, type TableCell, type TextRun } from "./page-blocks";
import { isLinkKind } from "./trip-links";
import { safeHref } from "../../text/safe-href";

export const PAGE_FRAGMENT = "page";

type Attrs = Record<string, unknown>;
type Delta = { insert?: unknown; attributes?: Attrs }[];

const MARK_ORDER: Mark["type"][] = ["bold", "italic", "underline", "strike", "link", "highlight", "comment"];

// Why the prefix: comments may overlap, so y-prosemirror stores each under `comment--<hash>`.
function markOf(key: string, value: unknown): Mark | null {
  const name = key.split("--", 1)[0];
  const attrs = (typeof value === "object" && value !== null ? value : {}) as Attrs;
  switch (name) {
    case "bold":
    case "italic":
    case "underline":
    case "strike":
      return { type: name };
    case "link": {
      const href = typeof attrs.href === "string" ? safeHref(attrs.href) : null;
      return href ? { type: "link", href } : null;
    }
    case "highlight":
      return isTone(attrs.tone) ? { type: "highlight", tone: attrs.tone } : null;
    case "comment":
      return typeof attrs.id === "number" ? { type: "comment", id: attrs.id } : null;
    default:
      return null;
  }
}

function marksOf(attributes: Attrs = {}): Mark[] {
  return Object.entries(attributes)
    .map(([key, value]) => markOf(key, value))
    .filter((mark): mark is Mark => mark !== null)
    .sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
}

const textRun = (text: string, marks: Mark[]): TextRun => (marks.length ? { type: "text", text, marks } : { type: "text", text });

function readInlineNode(node: Y.XmlElement | Y.XmlText): Inline[] {
  if (node instanceof Y.XmlText) {
    return (node.toDelta() as Delta)
      .filter((op): op is { insert: string; attributes?: Attrs } => typeof op.insert === "string")
      .map((op) => textRun(op.insert, marksOf(op.attributes)));
  }
  if (node.nodeName === "hardBreak") return [{ type: "text", text: "\n" }];
  const { kind, id, label } = node.getAttributes() as Attrs;
  if (node.nodeName !== "tripLink" || !isLinkKind(kind) || typeof id !== "number") return [];
  return [{ type: "tripLink", kind, id, label: typeof label === "string" ? label : "" }];
}

const sameMarks = (a: TextRun, b: TextRun) => JSON.stringify(a.marks ?? []) === JSON.stringify(b.marks ?? []);

function readInlines(element: Y.XmlElement): Inline[] {
  const runs: Inline[] = [];
  for (const run of (element.toArray() as (Y.XmlElement | Y.XmlText)[]).flatMap(readInlineNode)) {
    const last = runs[runs.length - 1];
    if (run.type === "text" && last?.type === "text" && sameMarks(last, run)) runs[runs.length - 1] = { ...last, text: last.text + run.text };
    else runs.push(run);
  }
  return runs.filter((run) => run.type !== "text" || run.text !== "");
}

const elements = (parent: Y.XmlElement | Y.XmlFragment) =>
  parent.toArray().filter((node): node is Y.XmlElement => node instanceof Y.XmlElement);

function readTable(table: Y.XmlElement): PageBlock | null {
  const rows = elements(table)
    .map((row) => elements(row).map((cell): TableCell => {
      const tone = cell.getAttribute("tone") as unknown;
      return { tone: isTone(tone) ? tone : null, content: readInlines(cell) };
    }))
    .filter((row) => row.length > 0);
  return rows.length ? { type: "table", header: (table.getAttribute("header") as unknown) === true, rows } : null;
}

function readBlock(element: Y.XmlElement): PageBlock | null {
  const attrs = element.getAttributes() as Attrs;
  const indent = clampIndent(attrs.indent);
  switch (element.nodeName) {
    case "paragraph":
    case "bullet":
    case "numbered":
    case "quote":
      return { type: element.nodeName, indent, content: readInlines(element) };
    case "heading": {
      const level = attrs.level === 1 || attrs.level === 2 ? attrs.level : 3;
      return { type: "heading", id: typeof attrs.id === "string" ? attrs.id : "", level, indent, content: readInlines(element) };
    }
    case "check":
      return { type: "check", indent, checked: attrs.checked === true, content: readInlines(element) };
    case "divider":
      return { type: "divider" };
    case "table":
      return readTable(element);
    default:
      return null;
  }
}

export function readPageYjs(doc: Y.Doc): PageBlock[] {
  const blocks = elements(doc.getXmlFragment(PAGE_FRAGMENT)).map(readBlock).filter((block): block is PageBlock => block !== null);
  return blocks.length ? blocks : EMPTY_PAGE;
}

function markAttrs(marks: readonly Mark[] = []): Attrs {
  const attrs: Attrs = {};
  for (const mark of marks) {
    if (mark.type === "link") attrs.link = { href: mark.href };
    else if (mark.type === "highlight") attrs.highlight = { tone: mark.tone };
    // Why eight characters: y-prosemirror only strips a `--` suffix of exactly eight.
    else if (mark.type === "comment") attrs[`comment--${mark.id.toString(36).padStart(8, "0")}`] = { id: mark.id };
    else attrs[mark.type] = {};
  }
  return attrs;
}

/** One inline list as y-prosemirror lays it out: text runs share an XmlText; a link or a break sits between. */
function inlineNodes(content: readonly Inline[]): { nodes: (Y.XmlElement | Y.XmlText)[]; fill: () => void } {
  const nodes: (Y.XmlElement | Y.XmlText)[] = [];
  const fills: [Y.XmlText, Delta][] = [];
  let open: Delta | null = null;
  const text = (insert: string, attributes: Attrs) => {
    if (!open) {
      open = [];
      const node = new Y.XmlText();
      nodes.push(node);
      fills.push([node, open]);
    }
    open.push({ insert, attributes });
  };
  for (const run of content) {
    if (run.type === "tripLink") {
      const link = new Y.XmlElement("tripLink");
      link.setAttribute("kind", run.kind);
      link.setAttribute("id", run.id as unknown as string);
      link.setAttribute("label", run.label);
      nodes.push(link);
      open = null;
      continue;
    }
    run.text.split("\n").forEach((part, i) => {
      if (i > 0) {
        nodes.push(new Y.XmlElement("hardBreak"));
        open = null;
      }
      if (part) text(part, markAttrs(run.marks));
    });
  }
  return { nodes, fill: () => { fills.forEach(([node, delta]) => { node.applyDelta(delta); }); } };
}

function element(name: string, attrs: Attrs, content: readonly Inline[] | null) {
  const node = new Y.XmlElement(name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value as string);
  const inner = content ? inlineNodes(content) : { nodes: [], fill: () => {} };
  node.insert(0, inner.nodes);
  return { node, fill: inner.fill };
}

function blockElement(block: PageBlock) {
  switch (block.type) {
    case "divider":
      return element("divider", {}, null);
    case "table": {
      const table = element("table", { header: block.header }, null);
      const cells = block.rows.map((row) => row.map((cell) => element("tableCell", cell.tone ? { tone: cell.tone } : {}, cell.content)));
      table.node.insert(0, cells.map((row) => {
        const tr = new Y.XmlElement("tableRow");
        tr.insert(0, row.map((cell) => cell.node));
        return tr;
      }));
      return { node: table.node, fill: () => { cells.flat().forEach((cell) => { cell.fill(); }); } };
    }
    case "heading":
      return element("heading", { id: block.id, level: block.level, indent: block.indent }, block.content);
    case "check":
      return element("check", { indent: block.indent, checked: block.checked }, block.content);
    default:
      return element(block.type, { indent: block.indent }, block.content);
  }
}

/** Fills an empty page doc. A doc that already has blocks is left alone. */
export function seedPageYjs(doc: Y.Doc, blocks: readonly PageBlock[]): void {
  const fragment = doc.getXmlFragment(PAGE_FRAGMENT);
  if (fragment.length > 0) return;
  doc.transact(() => {
    const made = blocks.map(blockElement);
    fragment.insert(0, made.map((block) => block.node));
    made.forEach((block) => { block.fill(); });
  });
}

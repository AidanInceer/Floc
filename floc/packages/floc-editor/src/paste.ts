/**
 * Pasted HTML, reshaped for a flat page (#408): nested lists become lines with
 * an indent, table cells keep one line each, pictures and styles go. What is
 * left the schema reads — headings, lists, checklists, bold, italic, links,
 * tables — and fonts and colours fall away because nothing reads them.
 */
import { MAX_INDENT } from "@floc/core/notes/pages/page-blocks";

const LISTS = new Set(["UL", "OL"]);
const BLOCKS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"]);

function lineKind(item: Element, list: Element): string {
  const role = item.getAttribute("role") === "checkbox" || item.hasAttribute("aria-checked") || item.querySelector(':scope > input[type="checkbox"]');
  if (role) return "check";
  return list.tagName === "OL" ? "numbered" : "bullet";
}

function flattenList(list: Element, depth: number, out: Element[], doc: Document) {
  for (const item of Array.from(list.children)) {
    if (item.tagName !== "LI") continue;
    const line = doc.createElement("p");
    line.dataset.type = lineKind(item, list);
    line.dataset.indent = String(Math.min(depth, MAX_INDENT));
    const checked = item.getAttribute("aria-checked") === "true" || item.querySelector<HTMLInputElement>(':scope > input[type="checkbox"]')?.checked === true;
    if (checked) line.dataset.checked = "true";
    const nested: Element[] = [];
    for (const child of Array.from(item.childNodes)) {
      if (child instanceof doc.defaultView!.Element && LISTS.has(child.tagName)) nested.push(child);
      else if (child instanceof doc.defaultView!.Element && child.tagName === "INPUT") continue;
      else if (child instanceof doc.defaultView!.Element && BLOCKS.has(child.tagName)) line.append(...Array.from(child.childNodes));
      else line.append(child);
    }
    out.push(line);
    for (const inner of nested) flattenList(inner, depth + 1, out, doc);
  }
}

function flattenCell(cell: Element, doc: Document) {
  const blocks = Array.from(cell.children).filter((child) => BLOCKS.has(child.tagName));
  blocks.forEach((block, i) => {
    if (i > 0) block.before(doc.createElement("br"));
    block.replaceWith(...Array.from(block.childNodes));
  });
}

export function reshapePastedHtml(html: string, parse: (html: string) => Document): string {
  const doc = parse(html);
  doc.querySelectorAll("img, picture, video, audio, svg, style, script, meta, link").forEach((element) => element.remove());
  doc.querySelectorAll("td, th").forEach((cell) => flattenCell(cell, doc));
  const tops = Array.from(doc.body.querySelectorAll("ul, ol")).filter((list) => !list.parentElement?.closest("ul, ol"));
  for (const list of tops) {
    const out: Element[] = [];
    flattenList(list, 0, out, doc);
    list.replaceWith(...out);
  }
  return doc.body.innerHTML;
}

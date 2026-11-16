import { Node, mergeAttributes } from "@tiptap/core";
import { isTone } from "@floc/core/notes/pages/page-blocks";

declare module "@tiptap/core" {
  interface NodeConfig {
    tableRole?: string;
  }
}

export const Table = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  tableRole: "table",
  extendNodeSchema: (extension) => ({ tableRole: extension.config.tableRole }),
  addAttributes: () => ({
    header: {
      default: false,
      parseHTML: (element: HTMLElement) => element.querySelector("th") !== null || element.dataset.header === "true",
      renderHTML: (attrs: { header?: boolean }) => ({ "data-header": attrs.header ? "true" : "false" }),
    },
  }),
  parseHTML: () => [{ tag: "table" }],
  renderHTML: ({ HTMLAttributes }) => ["table", mergeAttributes(HTMLAttributes, { class: "tbl" }), ["tbody", 0]],
});

export const TableRow = Node.create({
  name: "tableRow",
  content: "tableCell+",
  tableRole: "row",
  parseHTML: () => [{ tag: "tr" }],
  renderHTML: () => ["tr", 0],
});

export const TableCell = Node.create({
  name: "tableCell",
  content: "inline*",
  isolating: true,
  tableRole: "cell",
  addAttributes: () => ({
    tone: {
      default: null,
      parseHTML: (element: HTMLElement) => (isTone(element.dataset.tone) ? element.dataset.tone : null),
      renderHTML: (attrs: { tone?: string | null }) => (attrs.tone ? { "data-tone": attrs.tone } : {}),
    },
    colspan: { default: 1, parseHTML: () => 1, renderHTML: () => ({}) },
    rowspan: { default: 1, parseHTML: () => 1, renderHTML: () => ({}) },
    colwidth: { default: null, parseHTML: () => null, renderHTML: () => ({}) },
  }),
  parseHTML: () => [{ tag: "td" }, { tag: "th" }],
  renderHTML: ({ HTMLAttributes }) => ["td", mergeAttributes(HTMLAttributes), 0],
});

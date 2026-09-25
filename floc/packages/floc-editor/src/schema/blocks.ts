/**
 * A notes page's blocks (#408): flat lines with an indent, never nested lists.
 * Names and attributes match `@floc/core/notes/pages/page-yjs`, which reads
 * and seeds the same tree on the server.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { MAX_INDENT } from "@floc/core/notes/pages/page-blocks";

const indent = {
  indent: {
    default: 0,
    parseHTML: (element: HTMLElement) => Math.min(MAX_INDENT, Math.max(0, Number(element.dataset.indent ?? 0) || 0)),
    renderHTML: (attrs: { indent?: number }) => (attrs.indent ? { "data-indent": attrs.indent } : {}),
  },
};

/** The line kinds that hold text and take an indent. */
export const TEXT_BLOCKS = ["paragraph", "heading", "bullet", "numbered", "check", "quote"] as const;
export type TextBlockName = (typeof TEXT_BLOCKS)[number];
export const LIST_BLOCKS: readonly string[] = ["bullet", "numbered", "check"];

const line = (name: string, tag: string, parse: { tag: string; priority?: number }[]) =>
  Node.create({
    name,
    group: "block",
    content: "inline*",
    defining: true,
    addAttributes: () => indent,
    parseHTML: () => parse,
    // Why data-type: copy and paste go through this HTML, and a list line must come back a list line.
    renderHTML: ({ HTMLAttributes }) => [tag, mergeAttributes(HTMLAttributes, { class: `blk ${name}`, "data-type": name }), 0],
  });

export const Paragraph = line("paragraph", "p", [{ tag: "p" }]);
export const Bullet = line("bullet", "p", [{ tag: 'p[data-type="bullet"]', priority: 60 }]);
export const Numbered = line("numbered", "p", [{ tag: 'p[data-type="numbered"]', priority: 60 }]);
export const Quote = line("quote", "blockquote", [{ tag: "blockquote" }]);

export const Heading = Node.create({
  name: "heading",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes: () => ({
    ...indent,
    level: {
      default: 1,
      parseHTML: (element: HTMLElement) => Math.min(3, Number(element.tagName.slice(1)) || 3),
      renderHTML: () => ({}),
    },
    // Why an id: a folded heading is remembered per person, by this id.
    id: {
      default: "",
      parseHTML: () => "",
      renderHTML: (attrs: { id?: string }) => (attrs.id ? { "data-id": attrs.id } : {}),
    },
  }),
  parseHTML: () => ["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => ({ tag })),
  renderHTML: ({ node, HTMLAttributes }) => [`h${node.attrs.level as number}`, mergeAttributes(HTMLAttributes, { class: "blk heading" }), 0],
});

export const Check = Node.create({
  name: "check",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes: () => ({
    ...indent,
    checked: {
      default: false,
      parseHTML: (element: HTMLElement) => element.dataset.checked === "true" || element.getAttribute("aria-checked") === "true",
      renderHTML: (attrs: { checked?: boolean }) => ({ "data-checked": attrs.checked ? "true" : "false" }),
    },
  }),
  parseHTML: () => [{ tag: 'p[data-type="check"]', priority: 60 }],
  renderHTML: ({ HTMLAttributes }) => ["p", mergeAttributes(HTMLAttributes, { class: "blk check", "data-type": "check" }), 0],
});

export const Divider = Node.create({
  name: "divider",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML: () => [{ tag: "hr" }],
  renderHTML: () => ["div", { class: "blk divider", contenteditable: "false" }, ["hr"]],
});

export const PageDocument = Node.create({ name: "doc", topNode: true, content: "block+" });
export const Text = Node.create({ name: "text", group: "inline" });

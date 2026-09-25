/**
 * Marks (#408). Pasted text keeps bold, italic, underline, strike and links;
 * fonts and colours drop because nothing here reads them. Google Docs wraps a
 * paste in `<b style="font-weight:normal">`, which is not bold.
 */
import { Mark } from "@tiptap/core";
import { isTone } from "@floc/core/notes/pages/page-blocks";

const notNormal = (element: HTMLElement) => (element.style.fontWeight === "normal" || element.style.fontWeight === "400" ? false : null);

export const Bold = Mark.create({
  name: "bold",
  parseHTML: () => [
    { tag: "strong" },
    { tag: "b", getAttrs: notNormal },
    { style: "font-weight", getAttrs: (value: string) => (/^(bold(er)?|[6-9]00)$/.test(value) ? null : false) },
  ],
  renderHTML: () => ["strong", 0],
  addKeyboardShortcuts() {
    return { "Mod-b": () => this.editor.commands.toggleMark(this.name) };
  },
});

export const Italic = Mark.create({
  name: "italic",
  parseHTML: () => [{ tag: "em" }, { tag: "i" }, { style: "font-style=italic" }],
  renderHTML: () => ["em", 0],
  addKeyboardShortcuts() {
    return { "Mod-i": () => this.editor.commands.toggleMark(this.name) };
  },
});

export const Underline = Mark.create({
  name: "underline",
  parseHTML: () => [{ tag: "u" }, { style: "text-decoration", getAttrs: (value: string) => (value.includes("underline") ? null : false) }],
  renderHTML: () => ["u", 0],
  addKeyboardShortcuts() {
    return { "Mod-u": () => this.editor.commands.toggleMark(this.name) };
  },
});

export const Strike = Mark.create({
  name: "strike",
  parseHTML: () => [
    { tag: "s" },
    { tag: "del" },
    { tag: "strike" },
    { style: "text-decoration", getAttrs: (value: string) => (value.includes("line-through") ? null : false) },
  ],
  renderHTML: () => ["s", 0],
  addKeyboardShortcuts() {
    return { "Mod-Shift-s": () => this.editor.commands.toggleMark(this.name) };
  },
});

export const Link = Mark.create({
  name: "link",
  inclusive: false,
  addAttributes: () => ({ href: { default: "" } }),
  parseHTML: () => [{ tag: "a[href]", getAttrs: (element: HTMLElement) => ({ href: element.getAttribute("href") ?? "" }) }],
  renderHTML: ({ HTMLAttributes }) => ["a", { href: HTMLAttributes.href as string, rel: "noopener noreferrer nofollow", target: "_blank" }, 0],
});

export const Highlight = Mark.create({
  name: "highlight",
  addAttributes: () => ({ tone: { default: "butter" } }),
  // Why no parse from a background colour: a pasted page's colours are not ours to keep.
  parseHTML: () => [{ tag: "mark[data-tone]", getAttrs: (element: HTMLElement) => (isTone(element.dataset.tone) ? { tone: element.dataset.tone } : false) }],
  renderHTML: ({ HTMLAttributes }) => ["mark", { class: "hl", "data-tone": HTMLAttributes.tone as string }, 0],
});

/** A comment pinned to a range. Comments may overlap, so the mark does not exclude itself. */
export const Comment = Mark.create({
  name: "comment",
  excludes: "",
  inclusive: false,
  addAttributes: () => ({ id: { default: 0 } }),
  parseHTML: () => [],
  renderHTML: ({ HTMLAttributes }) => ["span", { class: "cmt", "data-comment": String(HTMLAttributes.id) }, 0],
});

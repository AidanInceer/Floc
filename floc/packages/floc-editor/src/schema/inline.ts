/** Inline nodes (#408): a line break, and a trip link — a chip naming one thing on the trip. */
import { Node } from "@tiptap/core";
import { isLinkKind } from "@floc/core/notes/pages/trip-links";

export const HardBreak = Node.create({
  name: "hardBreak",
  group: "inline",
  inline: true,
  selectable: false,
  parseHTML: () => [{ tag: "br" }],
  renderHTML: () => ["br"],
  renderText: () => "\n",
});

export const TripLink = Node.create({
  name: "tripLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes: () => ({
    kind: {
      default: "day",
      parseHTML: (element: HTMLElement) => (isLinkKind(element.dataset.kind) ? element.dataset.kind : "day"),
      renderHTML: (attrs: { kind: string }) => ({ "data-kind": attrs.kind }),
    },
    id: {
      default: 0,
      parseHTML: (element: HTMLElement) => Number(element.dataset.id) || 0,
      renderHTML: (attrs: { id: number }) => ({ "data-id": attrs.id }),
    },
    /** The last name this page saw — what it shows once the thing is gone. */
    label: { default: "", parseHTML: (element: HTMLElement) => element.textContent ?? "", renderHTML: () => ({}) },
  }),
  parseHTML: () => [{ tag: "span[data-trip-link]" }],
  renderHTML: ({ node, HTMLAttributes }) => ["span", { ...HTMLAttributes, "data-trip-link": "", class: "trip-link" }, node.attrs.label as string],
  renderText: ({ node }) => node.attrs.label as string,
});

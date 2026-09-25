/**
 * Hints on empty lines (#408): a blank page says how to start; the empty line
 * under the caret says what it is. Worked out afresh on every change — an
 * incremental one keeps a blank page's hint after a live sync fills it.
 */
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const BLANK_PAGE = "Write something, or type / for blocks";

const HINTS: Record<string, string> = {
  paragraph: "Type / for blocks",
  heading: "Heading",
  bullet: "List",
  numbered: "List",
  check: "To do",
  quote: "Quote",
};

export function placeholders(focused: () => boolean) {
  return new Plugin({
    props: {
      decorations(state) {
        const { doc, selection } = state;
        const only = doc.childCount === 1 ? doc.firstChild : null;
        if (only?.type.name === "paragraph" && only.content.size === 0) {
          return DecorationSet.create(doc, [Decoration.node(0, only.nodeSize, { class: "is-empty", "data-placeholder": BLANK_PAGE })]);
        }
        const { $from, empty } = selection;
        const line = $from.depth === 1 ? $from.parent : null;
        const hint = line ? HINTS[line.type.name] : undefined;
        if (!empty || !line || !hint || line.content.size > 0 || !focused()) return null;
        const pos = $from.before(1);
        return DecorationSet.create(doc, [Decoration.node(pos, pos + line.nodeSize, { class: "is-empty", "data-placeholder": hint })]);
      },
    },
  });
}

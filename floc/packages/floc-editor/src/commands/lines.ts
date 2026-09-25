/**
 * What Tab, Enter and Backspace do to a line (#408), as the prototype settled
 * it: lists continue, an empty list line steps out then ends, Backspace at the
 * start outdents before it does anything else. Tables keep their own keys.
 */
import type { Node } from "@tiptap/pm/model";
import { TextSelection, type Command, type EditorState } from "@tiptap/pm/state";
import { MAX_INDENT } from "@floc/core/notes/pages/page-blocks";
import { sectionEnd } from "@floc/core/notes/pages/page-outline";

import { LIST_BLOCKS, TEXT_BLOCKS } from "../schema/blocks";
import { outlineOf } from "./outline";

const isTextBlock = (node: Node) => (TEXT_BLOCKS as readonly string[]).includes(node.type.name);

/** The top-level line the caret is in, or null inside a table or on a non-text block. */
function currentLine(state: EditorState) {
  const { $from } = state.selection;
  if ($from.depth !== 1) return null;
  const node = $from.parent;
  return isTextBlock(node) ? { node, pos: $from.before(1), index: $from.index(0) } : null;
}

export function indentLines(step: 1 | -1): Command {
  return (state, dispatch) => {
    if (state.selection.$from.depth !== 1 && state.selection.$from.depth !== 0) return false;
    const tr = state.tr;
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
      if (!isTextBlock(node)) return false;
      const indent = Math.max(0, Math.min(MAX_INDENT, (node.attrs.indent as number) + step));
      if (indent !== node.attrs.indent) tr.setNodeAttribute(pos, "indent", indent);
      return false;
    });
    if (!tr.docChanged) return false;
    dispatch?.(tr);
    return true;
  };
}

const nextType = (name: string) => (LIST_BLOCKS.includes(name) ? name : "paragraph");

export function splitLine(folded: ReadonlySet<string> = new Set()): Command {
  return (state, dispatch) => {
    const here = currentLine(state);
    if (!here || state.selection.$to.parent !== here.node) return false;
    const { node, pos, index } = here;
    const indent = node.attrs.indent as number;
    if (LIST_BLOCKS.includes(node.type.name) && node.content.size === 0) {
      const tr = indent > 0
        ? state.tr.setNodeAttribute(pos, "indent", indent - 1)
        : state.tr.setNodeMarkup(pos, state.schema.nodes.paragraph, { indent: 0 });
      dispatch?.(tr);
      return true;
    }
    const type = state.schema.nodes[nextType(node.type.name)];
    const tr = state.tr.deleteSelection();
    if (node.type.name === "heading" && folded.has(node.attrs.id as string) && tr.selection.$from.parentOffset === node.content.size) {
      const end = sectionEnd(outlineOf(state.doc), index);
      let at = 0;
      for (let i = 0; i < end; i += 1) at += state.doc.child(i).nodeSize;
      tr.insert(at, state.schema.nodes.paragraph.create({ indent }));
      tr.setSelection(TextSelection.create(tr.doc, at + 1));
    } else {
      tr.split(tr.selection.from, 1, [{ type, attrs: { indent } }]);
    }
    dispatch?.(tr.scrollIntoView());
    return true;
  };
}

export const backspaceAtStart: Command = (state, dispatch) => {
  const here = currentLine(state);
  if (!here || !state.selection.empty || state.selection.$from.parentOffset !== 0) return false;
  const { node, pos, index } = here;
  const indent = node.attrs.indent as number;
  if (indent > 0) {
    dispatch?.(state.tr.setNodeAttribute(pos, "indent", indent - 1));
    return true;
  }
  if (node.type.name !== "paragraph") {
    dispatch?.(state.tr.setNodeMarkup(pos, state.schema.nodes.paragraph, { indent: 0 }));
    return true;
  }
  const before = index > 0 ? state.doc.child(index - 1) : null;
  if (before?.type.name !== "divider") return false;
  dispatch?.(state.tr.delete(pos - before.nodeSize, pos));
  return true;
};

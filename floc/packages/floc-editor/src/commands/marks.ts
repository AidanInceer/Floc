/** The selection bar's marks, comment anchors, and the checklist tick (#408). */
import type { Node } from "@tiptap/pm/model";
import type { Command } from "@tiptap/pm/state";
import { safeHref } from "@floc/core/text/safe-href";

export function addComment(id: number): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) return false;
    dispatch?.(state.tr.addMark(from, to, state.schema.marks.comment.create({ id })));
    return true;
  };
}

/** Takes a resolved thread's mark off every word it covered. */
export function removeComment(id: number): Command {
  return (state, dispatch) => {
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
      for (const mark of node.marks) {
        if (mark.type.name === "comment" && mark.attrs.id === id) tr.removeMark(pos, pos + node.nodeSize, mark);
      }
    });
    if (!tr.docChanged) return false;
    dispatch?.(tr);
    return true;
  };
}

/** Where each comment starts, in page order: its margin bubble sits level with it. */
export function commentAnchors(doc: Node): Map<number, number> {
  const anchors = new Map<number, number>();
  doc.descendants((node, pos) => {
    for (const mark of node.marks) {
      const id = mark.attrs.id as number;
      if (mark.type.name === "comment" && !anchors.has(id)) anchors.set(id, pos);
    }
  });
  return anchors;
}

export function setLink(raw: string): Command {
  return (state, dispatch) => {
    const text = raw.trim();
    const href = safeHref(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    if (!text || !href || state.selection.empty) return false;
    const { from, to } = state.selection;
    dispatch?.(state.tr.removeMark(from, to, state.schema.marks.link).addMark(from, to, state.schema.marks.link.create({ href })));
    return true;
  };
}

export function setHighlight(tone: string): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const type = state.schema.marks.highlight;
    dispatch?.(state.tr.removeMark(from, to, type).addMark(from, to, type.create({ tone })));
    return true;
  };
}

export function toggleCheck(pos: number): Command {
  return (state, dispatch) => {
    const node = state.doc.nodeAt(pos);
    if (node?.type.name !== "check") return false;
    dispatch?.(state.tr.setNodeAttribute(pos, "checked", !node.attrs.checked));
    return true;
  };
}

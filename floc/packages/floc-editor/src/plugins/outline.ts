/**
 * What a line shows besides its words (#408): list numbers (1, a, i by depth),
 * bullet shapes, the checkbox, and folded headings. All decoration — none of
 * it is stored — and folds are this person's alone.
 */
import type { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { bulletShape, canFold, hiddenLines, listNumbers } from "@floc/core/notes/pages/page-outline";

import { outlineOf } from "../commands/outline";
import { toggleCheck } from "../commands/marks";

export const outlineKey = new PluginKey<ReadonlySet<string>>("floc-outline");

export type LineLook = {
  pos: number;
  end: number;
  attrs: Record<string, string>;
  box?: boolean;
  fold?: { id: string; open: boolean };
};

/** Each top-level line's extra look, from the page and this person's folds. */
export function lineLooks(doc: Node, folded: ReadonlySet<string>): LineLook[] {
  const lines = outlineOf(doc);
  const numbers = listNumbers(lines);
  const hidden = hiddenLines(lines, folded);
  const looks: LineLook[] = [];
  let pos = 0;
  doc.forEach((node, offset, index) => {
    pos = offset;
    const classes: string[] = [];
    const attrs: Record<string, string> = {};
    const look: LineLook = { pos, end: pos + node.nodeSize, attrs };
    if (hidden[index]) classes.push("is-hidden");
    if (node.type.name === "numbered") attrs["data-marker"] = numbers[index] ?? "";
    if (node.type.name === "bullet") attrs["data-shape"] = bulletShape(lines[index].indent);
    if (node.type.name === "check") look.box = true;
    const id = node.attrs.id as string | undefined;
    if (node.type.name === "heading" && id && canFold(lines, index)) {
      look.fold = { id, open: !folded.has(id) };
      if (folded.has(id)) classes.push("is-folded");
    }
    if (classes.length) attrs.class = classes.join(" ");
    if (Object.keys(attrs).length || look.box || look.fold) looks.push(look);
  });
  return looks;
}

function button(className: string, label: string, pressed: string): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = className;
  el.contentEditable = "false";
  el.setAttribute("aria-label", label);
  el.setAttribute(className === "box" ? "aria-checked" : "aria-expanded", pressed);
  if (className === "box") el.setAttribute("role", "checkbox");
  return el;
}

function decorations(state: EditorState, folded: ReadonlySet<string>): DecorationSet {
  const decos: Decoration[] = [];
  for (const look of lineLooks(state.doc, folded)) {
    if (Object.keys(look.attrs).length) decos.push(Decoration.node(look.pos, look.end, look.attrs));
    if (look.box) {
      const checked = String(state.doc.nodeAt(look.pos)?.attrs.checked === true);
      decos.push(Decoration.widget(look.pos + 1, () => button("box", checked === "true" ? "Done" : "To do", checked), {
        side: -1, ignoreSelection: true, key: `box-${checked}`,
      }));
    }
    if (look.fold) {
      const { id, open } = look.fold;
      decos.push(Decoration.widget(look.pos + 1, () => button("fold", open ? "Hide section" : "Show section", String(open)), {
        side: -1, ignoreSelection: true, key: `fold-${id}-${String(open)}`,
      }));
    }
  }
  return DecorationSet.create(state.doc, decos);
}

function lineAt(view: EditorView, target: HTMLElement): number | null {
  const pos = view.posAtDOM(target, 0);
  const $pos = view.state.doc.resolve(pos);
  return $pos.depth >= 1 ? $pos.before(1) : null;
}

export function outlinePlugin(options: { folded: ReadonlySet<string>; onFold: (folded: ReadonlySet<string>) => void }) {
  return new Plugin<ReadonlySet<string>>({
    key: outlineKey,
    state: {
      init: () => options.folded,
      apply: (tr, value) => (tr.getMeta(outlineKey) as ReadonlySet<string> | undefined) ?? value,
    },
    props: {
      decorations(state) {
        return decorations(state, outlineKey.getState(state) ?? new Set());
      },
      handleDOMEvents: {
        mousedown(view, event) {
          const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("button.box, button.fold") : null;
          if (!target) return false;
          event.preventDefault();
          const pos = lineAt(view, target);
          if (pos === null) return true;
          if (target.classList.contains("box")) {
            toggleCheck(pos)(view.state, view.dispatch);
            return true;
          }
          const id = view.state.doc.nodeAt(pos)?.attrs.id as string;
          const folded = new Set(outlineKey.getState(view.state));
          if (folded.has(id)) folded.delete(id);
          else folded.add(id);
          view.dispatch(view.state.tr.setMeta(outlineKey, folded));
          options.onFold(folded);
          return true;
        },
      },
    },
  });
}

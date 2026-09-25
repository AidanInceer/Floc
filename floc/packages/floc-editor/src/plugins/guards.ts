/**
 * Quiet upkeep (#408): every heading gets an id (folds are kept by it), a
 * cell selection gets one outline round the whole group, and a page stops
 * growing at 1 MB. Changes that arrive from another person are never refused.
 */
import type { Node } from "@tiptap/pm/model";
import { Plugin, type Transaction } from "@tiptap/pm/state";
import { CellSelection, selectedRect } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { PAGE_LIMITS } from "@floc/core/notes/pages/page-rules";

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 8);

export function headingIds(makeId: () => string = newId) {
  return new Plugin({
    appendTransaction(transactions, _old, state) {
      if (!transactions.some((tr) => tr.docChanged)) return null;
      const tr = state.tr;
      state.doc.forEach((node, pos) => {
        if (node.type.name === "heading" && !node.attrs.id) tr.setNodeAttribute(pos, "id", makeId());
      });
      return tr.docChanged ? tr.setMeta("addToHistory", false) : null;
    },
  });
}

/** One outline round a group of selected cells: each edge cell draws only its outer side. */
export function cellEdges() {
  return new Plugin({
    props: {
      decorations(state) {
        if (!(state.selection instanceof CellSelection)) return null;
        const { top, bottom, left, right, map, tableStart } = selectedRect(state);
        const decos: Decoration[] = [];
        for (let row = top; row < bottom; row += 1) {
          for (let col = left; col < right; col += 1) {
            const pos = tableStart + map.map[row * map.width + col];
            const cell = state.doc.nodeAt(pos);
            if (!cell) continue;
            const edges = [row === top && "sel-t", row === bottom - 1 && "sel-b", col === left && "sel-l", col === right - 1 && "sel-r"].filter(Boolean);
            decos.push(Decoration.node(pos, pos + cell.nodeSize, { class: ["is-sel", ...edges].join(" ") }));
          }
        }
        return DecorationSet.create(state.doc, decos);
      },
    },
  });
}

const fromSomeoneElse = (tr: Transaction) => {
  const sync = tr.getMeta("y-sync$") as { isChangeOrigin?: boolean } | undefined;
  return sync?.isChangeOrigin === true;
};

// Why a character count first: serialising every keystroke of a big page is slow, and a page
// far under the limit cannot be over it.
const CHEAP_CHECK = PAGE_LIMITS.pageBytes / 4;

export const pageBytes = (doc: Node) => new TextEncoder().encode(JSON.stringify(doc.toJSON())).length;

export function sizeGuard(onFull: () => void) {
  return new Plugin({
    filterTransaction(tr, state) {
      if (!tr.docChanged || fromSomeoneElse(tr) || tr.doc.content.size <= state.doc.content.size) return true;
      if (tr.doc.content.size < CHEAP_CHECK || pageBytes(tr.doc) <= PAGE_LIMITS.pageBytes) return true;
      onFull();
      return false;
    },
  });
}

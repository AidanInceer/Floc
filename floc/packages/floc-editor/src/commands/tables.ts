/**
 * Table changes from the row and column handles (#408). Each is a small step
 * on the rows or cells it touches — never the whole table rewritten — so two
 * people editing one table both keep their words.
 */
import type { Node } from "@tiptap/pm/model";
import { TextSelection, type Command, type EditorState, type Transaction } from "@tiptap/pm/state";
import { CellSelection, TableMap, addColumn, addRow, removeColumn, removeRow, selectedRect, type TableRect } from "@tiptap/pm/tables";
import { tableRefusal } from "@floc/core/notes/pages/page-rules";

export type LineKind = "row" | "col";
export type CellRect = { top: number; bottom: number; left: number; right: number };

function tableAt(doc: Node, tablePos: number): { table: Node; map: TableMap; start: number } | null {
  const table = doc.nodeAt(tablePos);
  if (table?.type.name !== "table") return null;
  return { table, map: TableMap.get(table), start: tablePos + 1 };
}

const rectOf = (found: { table: Node; map: TableMap; start: number }): TableRect => ({
  table: found.table,
  map: found.map,
  tableStart: found.start,
  left: 0,
  top: 0,
  right: found.map.width,
  bottom: found.map.height,
});

export function insertLine(tablePos: number, kind: LineKind, index: number): Command {
  return (state, dispatch) => {
    const found = tableAt(state.doc, tablePos);
    if (!found) return false;
    const { width, height } = found.map;
    if (tableRefusal(width + (kind === "col" ? 1 : 0), height + (kind === "row" ? 1 : 0))) return false;
    const tr = state.tr;
    if (kind === "row") addRow(tr, rectOf(found), index);
    else addColumn(tr, rectOf(found), index);
    dispatch?.(tr);
    return true;
  };
}

export function deleteLines(tablePos: number, kind: LineKind, from: number, to: number): Command {
  return (state, dispatch) => {
    const found = tableAt(state.doc, tablePos);
    if (!found) return false;
    const total = kind === "row" ? found.map.height : found.map.width;
    if (to - from + 1 >= total) return false;
    const tr = state.tr;
    for (let index = to; index >= from; index -= 1) {
      const now = tableAt(tr.doc, tablePos);
      if (!now) break;
      if (kind === "row") removeRow(tr, rectOf(now), index);
      else removeColumn(tr, rectOf(now), index);
    }
    dispatch?.(tr);
    return true;
  };
}

function moveRows(tr: Transaction, tablePos: number, from: number, to: number, gap: number) {
  const found = tableAt(tr.doc, tablePos);
  if (!found) return;
  const offsets: number[] = [];
  found.table.forEach((_row, offset) => offsets.push(found.start + offset));
  const moving = Array.from({ length: to - from + 1 }, (_, i) => found.table.child(from + i));
  const end = offsets[to] + found.table.child(to).nodeSize;
  const target = gap < found.table.childCount ? offsets[gap] : found.start + found.table.content.size;
  if (gap > to) {
    tr.insert(target, moving);
    tr.delete(offsets[from], end);
  } else {
    tr.delete(offsets[from], end);
    tr.insert(target, moving);
  }
}

function moveCols(tr: Transaction, tablePos: number, from: number, to: number, gap: number) {
  const found = tableAt(tr.doc, tablePos);
  if (!found) return;
  const rows: { pos: number; row: Node }[] = [];
  found.table.forEach((row, offset) => rows.push({ pos: found.start + offset, row }));
  for (const { pos, row } of rows.reverse()) {
    const cells: Node[] = [];
    row.forEach((cell) => cells.push(cell));
    const moving = cells.slice(from, to + 1);
    const rest = [...cells.slice(0, from), ...cells.slice(to + 1)];
    const at = gap > to ? gap - moving.length : gap;
    rest.splice(at, 0, ...moving);
    tr.replaceWith(pos + 1, pos + row.nodeSize - 1, rest);
  }
}

/** Moves rows or columns `from`..`to` to sit before line `gap` (a gap of the line count is the end). */
export function moveLines(tablePos: number, kind: LineKind, from: number, to: number, gap: number): Command {
  return (state, dispatch) => {
    if (!tableAt(state.doc, tablePos) || (gap >= from && gap <= to + 1)) return false;
    const tr = state.tr;
    if (kind === "row") moveRows(tr, tablePos, from, to, gap);
    else moveCols(tr, tablePos, from, to, gap);
    dispatch?.(tr);
    return true;
  };
}

export function paintCells(tablePos: number, rect: CellRect, tone: string | null): Command {
  return (state, dispatch) => {
    const found = tableAt(state.doc, tablePos);
    if (!found) return false;
    const tr = state.tr;
    for (const offset of found.map.cellsInRect(rect)) {
      tr.setNodeAttribute(found.start + offset, "tone", tone);
    }
    dispatch?.(tr);
    return true;
  };
}

export function setTableHeader(tablePos: number, header: boolean): Command {
  return (state, dispatch) => {
    if (!tableAt(state.doc, tablePos)) return false;
    dispatch?.(state.tr.setNodeAttribute(tablePos, "header", header));
    return true;
  };
}

export function removeTable(tablePos: number): Command {
  return (state, dispatch) => {
    const found = tableAt(state.doc, tablePos);
    if (!found) return false;
    const tr = state.tr.delete(tablePos, tablePos + found.table.nodeSize);
    if (tr.doc.childCount === 0) tr.insert(0, state.schema.nodes.paragraph.create());
    dispatch?.(tr);
    return true;
  };
}

export function selectLines(tablePos: number, kind: LineKind, from: number, to: number): Command {
  return (state, dispatch) => {
    const found = tableAt(state.doc, tablePos);
    if (!found) return false;
    const { map, start } = found;
    const cellAt = (row: number, col: number) => state.doc.resolve(start + map.map[row * map.width + col]);
    const selection = kind === "row"
      ? CellSelection.rowSelection(cellAt(from, 0), cellAt(to, map.width - 1))
      : CellSelection.colSelection(cellAt(0, from), cellAt(map.height - 1, to));
    dispatch?.(state.tr.setSelection(selection));
    return true;
  };
}

export type CellsInfo = { tablePos: number; rect: CellRect; count: number; whole: LineKind | null };

/** What a cell selection covers: how many cells, and whether they are whole rows or columns (which Delete removes). */
export function selectionInfo(state: EditorState): CellsInfo | null {
  if (!(state.selection instanceof CellSelection)) return null;
  const { top, bottom, left, right, map, tableStart } = selectedRect(state);
  const rows = bottom - top;
  const cols = right - left;
  const whole: LineKind | null =
    left === 0 && right === map.width && rows < map.height ? "row"
      : top === 0 && bottom === map.height && cols < map.width ? "col"
        : null;
  return { tablePos: tableStart - 1, rect: { top, bottom, left, right }, count: rows * cols, whole };
}

/** Enter in a cell goes down a row, adding one at the bottom, as a sheet does. */
export const cellEnter: Command = (state, dispatch) => {
  const { $from } = state.selection;
  if ($from.parent.type.name !== "tableCell") return false;
  const tablePos = $from.before($from.depth - 2);
  const found = tableAt(state.doc, tablePos);
  if (!found) return false;
  const here = found.map.findCell($from.before($from.depth) - found.start);
  const tr = state.tr;
  if (here.bottom >= found.map.height) {
    if (tableRefusal(found.map.width, found.map.height + 1)) return false;
    addRow(tr, rectOf(found), found.map.height);
  }
  const now = tableAt(tr.doc, tablePos);
  if (!now) return false;
  const below = now.start + now.map.map[here.bottom * now.map.width + here.left];
  dispatch?.(tr.setSelection(TextSelection.create(tr.doc, below + 1)).scrollIntoView());
  return true;
};

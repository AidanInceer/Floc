/**
 * Table handles (#408): a six-dot grip beside the row and above the column
 * under the pointer — drag to move, click for options — a corner menu, and
 * add-row and add-column bars. On a phone the grips follow the caret instead
 * of the pointer, and the menu moves lines instead of a drag.
 */
"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { TableMap } from "@tiptap/pm/tables";

import { insertLine, moveLines, selectLines, selectionInfo, type LineKind } from "../commands/tables";
import { Icon } from "./icons";
import { CellBar, LineMenu, TableMenu, type LineMenuAt } from "./table-menus";
import { useViewportTick, type Point } from "./floating";

type Hover = { tablePos: number; row: number; col: number };
type Drag = { kind: LineKind; from: number; to: number; x: number; y: number; live: boolean; gap: number | null };

function tablePosOf(editor: Editor, cell: HTMLElement): number | null {
  const $pos = editor.state.doc.resolve(editor.view.posAtDOM(cell, 0));
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === "table") return $pos.before(depth);
  }
  return null;
}

function tableElement(editor: Editor, tablePos: number): HTMLTableElement | null {
  const dom = editor.view.nodeDOM(tablePos);
  return dom instanceof HTMLTableElement ? dom : null;
}

function caretCell(editor: Editor): Hover | null {
  const { $from } = editor.state.selection;
  if ($from.parent.type.name !== "tableCell") return null;
  const tablePos = $from.before($from.depth - 2);
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return null;
  const cell = TableMap.get(table).findCell($from.before($from.depth) - tablePos - 1);
  return { tablePos, row: cell.top, col: cell.left };
}

function dropGap(table: HTMLTableElement, kind: LineKind, event: PointerEvent) {
  const edges = kind === "row"
    ? Array.from(table.rows).map((row) => row.getBoundingClientRect())
    : Array.from(table.rows[0]?.cells ?? []).map((cell) => cell.getBoundingClientRect());
  const at = kind === "row" ? event.clientY : event.clientX;
  const gap = edges.filter((rect) => (kind === "row" ? rect.top + rect.height / 2 : rect.left + rect.width / 2) < at).length;
  const box = table.getBoundingClientRect();
  const edge = gap < edges.length ? edges[gap] : edges[edges.length - 1];
  const line = kind === "row"
    ? { left: box.left, top: gap < edges.length ? edge.top : edge.bottom, width: box.width, height: 3 }
    : { left: gap < edges.length ? edge.left : edge.right, top: box.top, width: 3, height: box.height };
  return { gap, line };
}

/** The run of whole rows or columns already selected around `index`, or just `index`. Shift reaches from the run to it. */
function selectedSpan(editor: Editor, tablePos: number, kind: LineKind, index: number, extend = false): [number, number] {
  const info = selectionInfo(editor.state);
  if (info?.tablePos !== tablePos || info.whole !== kind) return [index, index];
  const [from, to] = kind === "row" ? [info.rect.top, info.rect.bottom - 1] : [info.rect.left, info.rect.right - 1];
  if (extend) return [Math.min(from, index), Math.max(to, index)];
  return index >= from && index <= to ? [from, to] : [index, index];
}

function useHover(editor: Editor, touch: boolean): [Hover | null, (hover: Hover | null) => void] {
  const [hover, setHover] = useState<Hover | null>(null);
  const caret = useEditorState({ editor, selector: ({ editor: e }) => (touch ? caretCell(e) : null), equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
  useEffect(() => {
    if (touch) return;
    const dom = editor.view.dom;
    const move = (event: MouseEvent) => {
      const cell = (event.target as HTMLElement).closest?.("td");
      if (!cell || !(cell.parentElement instanceof HTMLTableRowElement)) return;
      const tablePos = tablePosOf(editor, cell);
      if (tablePos === null) return;
      const next = { tablePos, row: cell.parentElement.rowIndex, col: (cell as HTMLTableCellElement).cellIndex };
      setHover((now) => (now && now.tablePos === next.tablePos && now.row === next.row && now.col === next.col ? now : next));
    };
    dom.addEventListener("mousemove", move);
    return () => { dom.removeEventListener("mousemove", move); };
  }, [editor, touch]);
  return [touch ? caret : hover, setHover];
}

function useRedraw(editor: Editor) {
  const [, redraw] = useState(0);
  useViewportTick();
  useEffect(() => {
    const again = () => redraw((n) => n + 1);
    editor.on("update", again);
    return () => { editor.off("update", again); };
  }, [editor]);
}

type Line = { left: number; top: number; width: number; height: number };

function useLineDrag(editor: Editor, hover: Hover | null) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [line, setLine] = useState<Line | null>(null);
  useEffect(() => {
    if (!drag || !hover) return;
    const table = tableElement(editor, hover.tablePos);
    const move = (event: PointerEvent) => {
      if (!table || (!drag.live && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5)) return;
      if (!drag.live) selectLines(hover.tablePos, drag.kind, drag.from, drag.to)(editor.state, editor.view.dispatch);
      const hit = dropGap(table, drag.kind, event);
      setDrag({ ...drag, live: true, gap: hit.gap });
      setLine(hit.line);
    };
    const up = () => {
      if (drag.live && drag.gap !== null) moveLines(hover.tablePos, drag.kind, drag.from, drag.to, drag.gap)(editor.state, editor.view.dispatch);
      setDrag(null);
      setLine(null);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up, { once: true });
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
  }, [drag, hover, editor]);
  return { drag, setDrag, line };
}

function Handles({ editor, hover, table, touch, drag, onDrag, onMenu, onTableMenu }: {
  editor: Editor; hover: Hover; table: HTMLTableElement; touch: boolean; drag: Drag | null;
  onDrag: (drag: Drag) => void; onMenu: (menu: LineMenuAt) => void; onTableMenu: (at: Point) => void;
}) {
  const box = table.getBoundingClientRect();
  const row = table.rows[hover.row]?.getBoundingClientRect();
  const col = table.rows[0]?.cells[hover.col]?.getBoundingClientRect();
  if (!row || !col) return null;
  const rows = table.rows.length;
  const cols = table.rows[0]?.cells.length ?? 0;
  const below = (el: HTMLElement): Point => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom + 4 };
  };
  const grip = (kind: LineKind, index: number) => ({
    onPointerDown: (event: ReactPointerEvent) => {
      const [from, to] = selectedSpan(editor, hover.tablePos, kind, index);
      if (!touch && event.button === 0 && !event.shiftKey) onDrag({ kind, from, to, x: event.clientX, y: event.clientY, live: false, gap: null });
    },
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (drag?.live) return;
      const [from, to] = selectedSpan(editor, hover.tablePos, kind, index, event.shiftKey);
      selectLines(hover.tablePos, kind, from, to)(editor.state, editor.view.dispatch);
      // Why: Delete on the chosen rows goes through the page's own keys.
      editor.view.focus();
      onMenu({ tablePos: hover.tablePos, kind, from, to, at: below(event.currentTarget) });
    },
  });
  const add = (kind: LineKind, at: number) => () => { insertLine(hover.tablePos, kind, at)(editor.state, editor.view.dispatch); };
  return (
    <>
      <button type="button" className="fe-grip is-row" style={{ left: box.left - 26, top: row.top + row.height / 2 - 11 }} title="Drag to move, click for options" aria-label={`Row ${hover.row + 1} options`} {...grip("row", hover.row)}>
        <Icon name="grip" />
      </button>
      <button type="button" className="fe-grip is-col" style={{ left: col.left + col.width / 2 - 12, top: box.top - 21 }} title="Drag to move, click for options" aria-label={`Column ${hover.col + 1} options`} {...grip("col", hover.col)}>
        <Icon name="gripH" />
      </button>
      <button type="button" className="fe-grip is-corner" style={{ left: box.left - 28, top: box.top - 24 }} title="Table options" aria-label="Table options" onClick={(event) => onTableMenu(below(event.currentTarget))}>
        <Icon name="dots" />
      </button>
      <button type="button" className="fe-add is-col" style={{ left: box.right + 4, top: box.top, height: box.height }} title="Add a column" aria-label="Add a column" onClick={add("col", cols)}>
        <Icon name="plus" />
      </button>
      <button type="button" className="fe-add is-row" style={{ left: box.left, top: box.bottom + 4, width: box.width }} title="Add a row" aria-label="Add a row" onClick={add("row", rows)}>
        <Icon name="plus" />
      </button>
    </>
  );
}

export function TableTools({ editor, touch }: { editor: Editor; touch: boolean }) {
  const [hover, setHover] = useHover(editor, touch);
  const [menu, setMenu] = useState<LineMenuAt | null>(null);
  const [tableMenu, setTableMenu] = useState<{ tablePos: number; at: Point } | null>(null);
  const { drag, setDrag, line } = useLineDrag(editor, hover);
  const closeMenu = useCallback(() => setMenu(null), []);
  const closeTableMenu = useCallback(() => setTableMenu(null), []);
  const leave = useCallback(() => setHover(null), [setHover]);
  useRedraw(editor);
  useEffect(() => {
    const stale = () => setMenu(null);
    editor.on("update", stale);
    return () => { editor.off("update", stale); };
  }, [editor]);

  const table = hover && editor.isEditable ? tableElement(editor, hover.tablePos) : null;
  return (
    <>
      {hover && table ? (
        <Handles editor={editor} hover={hover} table={table} touch={touch} drag={drag} onDrag={setDrag} onMenu={setMenu}
          onTableMenu={(at) => setTableMenu({ tablePos: hover.tablePos, at })} />
      ) : null}
      {line ? <div className="fe-drop-line" style={line} /> : null}
      {menu ? <LineMenu editor={editor} menu={menu} touch={touch} onClose={closeMenu} /> : null}
      {tableMenu ? <TableMenu editor={editor} tablePos={tableMenu.tablePos} at={tableMenu.at} onClose={closeTableMenu} /> : null}
      {!menu ? <CellBar editor={editor} /> : null}
      {table && !touch ? <HoverKeeper table={table} onLeave={leave} busy={!!menu || !!tableMenu || !!drag} /> : null}
    </>
  );
}

/** Clears the grips once the pointer is well clear of the table and its handles. */
function HoverKeeper({ table, onLeave, busy }: { table: HTMLTableElement; onLeave: () => void; busy: boolean }) {
  useEffect(() => {
    if (busy) return;
    const move = (event: MouseEvent) => {
      const box = table.getBoundingClientRect();
      const near = event.clientX > box.left - 40 && event.clientX < box.right + 32 && event.clientY > box.top - 32 && event.clientY < box.bottom + 32;
      if (!near) onLeave();
    };
    document.addEventListener("mousemove", move);
    return () => { document.removeEventListener("mousemove", move); };
  }, [table, onLeave, busy]);
  return null;
}

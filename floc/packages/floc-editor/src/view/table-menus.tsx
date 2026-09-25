/**
 * What the table handles open (#408): a row or column menu, the table's own
 * menu, and the bar over a group of selected cells.
 */
"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { deleteCellSelection } from "@tiptap/pm/tables";
import type { Command } from "@tiptap/pm/state";
import { tableRefusal } from "@floc/core/notes/pages/page-rules";

import { deleteLines, insertLine, moveLines, paintCells, removeTable, selectionInfo, setTableHeader, type CellsInfo, type LineKind } from "../commands/tables";
import { Icon } from "./icons";
import { Menu, Swatches, type Point } from "./floating";

export type LineMenuAt = { tablePos: number; kind: LineKind; from: number; to: number; at: Point };

const run = (editor: Editor, command: Command) => command(editor.state, editor.view.dispatch);

function size(editor: Editor, tablePos: number) {
  const table = editor.state.doc.nodeAt(tablePos);
  return { rows: table?.childCount ?? 0, cols: table?.firstChild?.childCount ?? 0 };
}

export function LineMenu({ editor, menu, touch, onClose }: { editor: Editor; menu: LineMenuAt; touch: boolean; onClose: () => void }) {
  const { tablePos, kind, from, to } = menu;
  const { rows, cols } = size(editor, tablePos);
  const total = kind === "row" ? rows : cols;
  const n = to - from + 1;
  const word = kind === "row" ? "row" : "column";
  const full = tableRefusal(cols + (kind === "col" ? 1 : 0), rows + (kind === "row" ? 1 : 0));
  const act = (command: Command) => {
    run(editor, command);
    onClose();
  };
  const rect = kind === "row" ? { top: from, bottom: to + 1, left: 0, right: cols } : { top: 0, bottom: rows, left: from, right: to + 1 };
  return (
    <Menu at={menu.at} label={`${word} options`} onClose={onClose}>
      <button type="button" disabled={!!full} title={full ?? undefined} onClick={() => act(insertLine(tablePos, kind, from))}>{kind === "row" ? "Insert above" : "Insert left"}</button>
      <button type="button" disabled={!!full} title={full ?? undefined} onClick={() => act(insertLine(tablePos, kind, to + 1))}>{kind === "row" ? "Insert below" : "Insert right"}</button>
      {touch ? (
        <>
          <button type="button" disabled={from === 0} onClick={() => act(moveLines(tablePos, kind, from, to, from - 1))}>{kind === "row" ? "Move up" : "Move left"}</button>
          <button type="button" disabled={to >= total - 1} onClick={() => act(moveLines(tablePos, kind, from, to, to + 2))}>{kind === "row" ? "Move down" : "Move right"}</button>
        </>
      ) : null}
      <div className="fe-menu-sep" />
      <p className="fe-menu-label">Colour</p>
      <Swatches none what="colour" onPick={(tone) => act(paintCells(tablePos, rect, tone))} />
      <div className="fe-menu-sep" />
      <button type="button" className="is-danger" disabled={n >= total} title={n >= total ? `A table keeps at least one ${word}` : undefined} onClick={() => act(deleteLines(tablePos, kind, from, to))}>
        {n > 1 ? `Delete ${n} ${word}s` : `Delete ${word}`}
      </button>
    </Menu>
  );
}

export function TableMenu({ editor, tablePos, at, onClose }: { editor: Editor; tablePos: number; at: Point; onClose: () => void }) {
  const header = editor.state.doc.nodeAt(tablePos)?.attrs.header === true;
  return (
    <Menu at={at} label="Table options" onClose={onClose}>
      <button type="button" role="menuitemcheckbox" aria-checked={header} className="has-check" onClick={() => { run(editor, setTableHeader(tablePos, !header)); onClose(); }}>
        <span className="fe-check">{header ? <Icon name="check" /> : null}</span>
        Header row
      </button>
      <div className="fe-menu-sep" />
      <button type="button" className="is-danger" onClick={() => { run(editor, removeTable(tablePos)); onClose(); }}>Delete table</button>
    </Menu>
  );
}

function barPlace(editor: Editor, info: CellsInfo): { left: number; top: number } | null {
  const table = editor.view.nodeDOM(info.tablePos);
  const first = table instanceof HTMLTableElement ? table.rows[info.rect.top]?.cells : undefined;
  const a = first?.[info.rect.left]?.getBoundingClientRect();
  const z = first?.[info.rect.right - 1]?.getBoundingClientRect();
  return a && z ? { left: (a.left + z.right) / 2, top: Math.max(8, a.top - 48) } : null;
}

function DeleteLines({ editor, info, whole }: { editor: Editor; info: CellsInfo; whole: LineKind }) {
  const [from, to] = whole === "row" ? [info.rect.top, info.rect.bottom - 1] : [info.rect.left, info.rect.right - 1];
  const lines = to - from + 1;
  const word = whole === "row" ? "row" : "column";
  return (
    <button type="button" className="fe-tool is-danger" title="Delete, or press Delete" onClick={() => { run(editor, deleteLines(info.tablePos, whole, from, to)); }}>
      <Icon name="trash" />
      {lines > 1 ? `Delete ${lines} ${word}s` : `Delete ${word}`}
    </button>
  );
}

/** Over a group of selected cells: how many, a colour, clear the words, and delete when they are whole rows or columns. */
export function CellBar({ editor }: { editor: Editor }) {
  const info = useEditorState({ editor, selector: ({ editor: e }) => selectionInfo(e.state), equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
  const place = info ? barPlace(editor, info) : null;
  if (!info || !place) return null;
  return (
    <div className="fe-bar fe-cellbar" role="toolbar" aria-label="Cells" tabIndex={-1} style={place} onMouseDown={(event) => event.preventDefault()}>
      <span className="fe-count">{`${info.count} cell${info.count > 1 ? "s" : ""}`}</span>
      <span className="fe-sep" />
      <Swatches none what="background" onPick={(tone) => { run(editor, paintCells(info.tablePos, info.rect, tone)); }} />
      <span className="fe-sep" />
      <button type="button" className="fe-tool" title="Clear text" aria-label="Clear text" onClick={() => { run(editor, deleteCellSelection); }}>
        <Icon name="clear" />
      </button>
      {info.whole ? <DeleteLines editor={editor} info={info} whole={info.whole} /> : null}
    </div>
  );
}

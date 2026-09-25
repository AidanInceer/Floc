import { describe, expect, it } from "vitest";
import { CellSelection } from "@tiptap/pm/tables";
import type { EditorState } from "@tiptap/pm/state";

import {
  cellEnter,
  deleteLines,
  insertLine,
  moveLines,
  paintCells,
  selectLines,
  selectionInfo,
  setTableHeader,
  removeTable,
} from "./tables";
import { caretIn, line, lines, page, run, table } from "./testing";

const grid = (state: EditorState) => {
  const node = state.doc.child(0);
  const out: string[][] = [];
  node.forEach((row) => {
    const cells: string[] = [];
    row.forEach((cell) => cells.push(cell.textContent + (cell.attrs.tone ? `(${cell.attrs.tone as string})` : "")));
    out.push(cells);
  });
  return out;
};

const start = () => caretIn(page(table([["a", "b"], ["c", "d"], ["e", "f"]]), line("paragraph")), 0, 2);

describe("rows and columns", () => {
  it("inserts a row or a column at an index", () => {
    expect(grid(run(insertLine(0, "row", 1), start()).state)).toEqual([["a", "b"], ["", ""], ["c", "d"], ["e", "f"]]);
    expect(grid(run(insertLine(0, "col", 0), start()).state)).toEqual([["", "a", "b"], ["", "c", "d"], ["", "e", "f"]]);
  });

  it("refuses a table past its limits", () => {
    const wide = caretIn(page(table([Array.from({ length: 20 }, () => "x")])), 0, 2);
    expect(run(insertLine(0, "col", 0), wide).ok).toBe(false);
    const long = caretIn(page(table(Array.from({ length: 200 }, () => ["x"]))), 0, 2);
    expect(run(insertLine(0, "row", 0), long).ok).toBe(false);
  });

  it("deletes a run of rows or columns, never all of them", () => {
    expect(grid(run(deleteLines(0, "row", 0, 1), start()).state)).toEqual([["e", "f"]]);
    expect(grid(run(deleteLines(0, "col", 1, 1), start()).state)).toEqual([["a"], ["c"], ["e"]]);
    expect(run(deleteLines(0, "row", 0, 2), start()).ok).toBe(false);
  });

  it("moves a run of rows or columns to a gap", () => {
    expect(grid(run(moveLines(0, "row", 0, 0, 3), start()).state)).toEqual([["c", "d"], ["e", "f"], ["a", "b"]]);
    expect(grid(run(moveLines(0, "row", 1, 2, 0), start()).state)).toEqual([["c", "d"], ["e", "f"], ["a", "b"]]);
    expect(grid(run(moveLines(0, "col", 1, 1, 0), start()).state)).toEqual([["b", "a"], ["d", "c"], ["f", "e"]]);
    expect(run(moveLines(0, "row", 0, 0, 1), start()).ok).toBe(false);
  });

  it("colours the chosen cells, and clears them", () => {
    const toned = run(paintCells(0, { top: 0, bottom: 1, left: 1, right: 2 }, "mint"), start()).state;
    expect(grid(toned)).toEqual([["a", "b(mint)"], ["c", "d"], ["e", "f"]]);
    expect(grid(run(paintCells(0, { top: 0, bottom: 3, left: 0, right: 2 }, null), toned).state)).toEqual([["a", "b"], ["c", "d"], ["e", "f"]]);
  });
});

describe("the table itself", () => {
  it("turns the header row on and off", () => {
    const on = run(setTableHeader(0, true), start()).state;
    expect(on.doc.child(0).attrs.header).toBe(true);
    expect(run(setTableHeader(0, false), on).state.doc.child(0).attrs.header).toBe(false);
  });

  it("deletes the table, and keeps a line when it was the only thing", () => {
    expect(lines(run(removeTable(0), start()).state)).toEqual(["paragraph:0:"]);
    expect(lines(run(removeTable(0), caretIn(page(table([["a"]])), 0, 2)).state)).toEqual(["paragraph:0:"]);
  });

  it("answers nothing for a position that is not a table", () => {
    const plain = caretIn(page(line("paragraph", "x")), 0);
    for (const command of [insertLine(0, "row", 0), deleteLines(0, "row", 0, 0), moveLines(0, "row", 0, 0, 1), setTableHeader(0, true), removeTable(0), selectLines(0, "row", 0, 0), paintCells(0, { top: 0, bottom: 1, left: 0, right: 1 }, "mint")]) {
      expect(run(command, plain).ok).toBe(false);
    }
  });
});

describe("selecting cells", () => {
  it("selects whole rows or columns, and says so", () => {
    const rows = run(selectLines(0, "row", 1, 2), start()).state;
    expect(rows.selection).toBeInstanceOf(CellSelection);
    expect(selectionInfo(rows)).toMatchObject({ tablePos: 0, count: 4, whole: "row", rect: { top: 1, bottom: 3, left: 0, right: 2 } });
    const cols = run(selectLines(0, "col", 0, 0), start()).state;
    expect(selectionInfo(cols)).toMatchObject({ count: 3, whole: "col" });
  });

  it("calls every cell of a table neither whole rows nor columns, and a caret no selection", () => {
    expect(selectionInfo(start())).toBeNull();
  });
});

describe("cellEnter", () => {
  it("moves down a row, and adds one at the bottom", () => {
    const down = run(cellEnter, start()).state;
    expect(down.selection.$from.parent.textContent).toBe("c");
    const bottom = caretIn(page(table([["a"]])), 0, 2);
    const grown = run(cellEnter, bottom).state;
    expect(grown.doc.child(0).childCount).toBe(2);
    expect(grown.selection.$from.parent.type.name).toBe("tableCell");
    expect(run(cellEnter, caretIn(page(line("paragraph")), 0)).ok).toBe(false);
  });
});

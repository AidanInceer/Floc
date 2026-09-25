import { describe, expect, it, vi } from "vitest";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";
import type { DecorationSet } from "@tiptap/pm/view";

import { cellEdges, headingIds, sizeGuard } from "./guards";
import { line, page, schema, table } from "../commands/testing";

describe("headingIds", () => {
  it("gives a new heading an id, and leaves one that has it", () => {
    let n = 0;
    const state = EditorState.create({ doc: page(line("heading", "Kept", { id: "k" }), line("paragraph", "x")), plugins: [headingIds(() => `id-${(n += 1)}`)] });
    const next = state.apply(state.tr.setNodeMarkup(state.doc.child(0).nodeSize, schema.nodes.heading, { level: 2 }));
    expect([next.doc.child(0).attrs.id, next.doc.child(1).attrs.id]).toEqual(["k", "id-1"]);
    expect(state.apply(state.tr.setMeta("x", 1)).doc.eq(state.doc)).toBe(true);
  });
});

describe("cellEdges", () => {
  it("outlines only the outer sides of a selected group", () => {
    const doc = page(table([["a", "b"], ["c", "d"]]));
    const plugin = cellEdges();
    const state = EditorState.create({ doc, plugins: [plugin] });
    const cells = state.apply(state.tr.setSelection(CellSelection.create(doc, 2, 5)));
    const set = plugin.props.decorations?.call(plugin, cells) as DecorationSet | null;
    const found = set ? set.find().map((deco) => (deco as unknown as { type: { attrs: { class: string } } }).type.attrs.class) : [];
    expect(found).toEqual(["is-sel sel-t sel-b sel-l", "is-sel sel-t sel-b sel-r"]);
    expect(plugin.props.decorations?.call(plugin, state)).toBeNull();
  });
});

describe("sizeGuard", () => {
  it("stops a page growing past 1 MB, and says so", () => {
    const onFull = vi.fn();
    const big = "x".repeat(600_000);
    const state = EditorState.create({ doc: page(line("paragraph", big)), plugins: [sizeGuard(onFull)] });
    const at = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
    const grown = at.apply(at.tr.insertText(big, 1));
    expect(grown.doc.content.size).toBe(state.doc.content.size);
    expect(onFull).toHaveBeenCalledOnce();
  });

  it("lets a small page grow, lets it shrink, and never refuses another person's change", () => {
    const onFull = vi.fn();
    const state = EditorState.create({ doc: page(line("paragraph", "x".repeat(600_000))), plugins: [sizeGuard(onFull)] });
    const small = EditorState.create({ doc: page(line("paragraph", "a")), plugins: [sizeGuard(onFull)] });
    expect(small.apply(small.tr.insertText("b", 1)).doc.textContent).toBe("ba");
    expect(state.apply(state.tr.delete(1, 3)).doc.content.size).toBe(state.doc.content.size - 2);
    const remote = state.tr.insertText("y".repeat(600_000), 1).setMeta("y-sync$", { isChangeOrigin: true });
    expect(state.apply(remote).doc.content.size).toBeGreaterThan(state.doc.content.size);
    expect(onFull).not.toHaveBeenCalled();
  });
});

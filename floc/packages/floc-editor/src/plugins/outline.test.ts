import { describe, expect, it } from "vitest";
import { EditorState } from "@tiptap/pm/state";

import { lineLooks, outlineKey, outlinePlugin } from "./outline";
import { line, page } from "../commands/testing";

const doc = page(
  line("heading", "To book", { level: 2, id: "h" }),
  line("check", "Flights", { checked: true }),
  line("numbered", "one"),
  line("numbered", "sub", { indent: 1 }),
  line("bullet", "dot", { indent: 1 }),
  line("heading", "Empty", { level: 2, id: "e" }),
  line("paragraph", "plain"),
);

describe("lineLooks", () => {
  it("numbers, shapes, boxes and fold controls, with nothing on plain text", () => {
    const looks = lineLooks(doc, new Set());
    expect(looks.map((look) => [look.attrs, look.box ?? false, look.fold ?? null])).toEqual([
      [{}, false, { id: "h", open: true }],
      [{}, true, null],
      [{ "data-marker": "1." }, false, null],
      [{ "data-marker": "a." }, false, null],
      [{ "data-shape": "ring" }, false, null],
      [{}, false, { id: "e", open: true }],
    ]);
  });

  it("hides a folded heading's section and marks the heading", () => {
    const looks = lineLooks(doc, new Set(["h"]));
    expect(looks[0]).toMatchObject({ attrs: { class: "is-folded" }, fold: { open: false } });
    expect(looks.slice(1, 5).every((look) => look.attrs.class === "is-hidden")).toBe(true);
  });
});

describe("outlinePlugin", () => {
  it("keeps this person's folds, and changes them on request", () => {
    const plugin = outlinePlugin({ folded: new Set(["h"]), onFold: () => {} });
    const state = EditorState.create({ doc, plugins: [plugin] });
    expect(outlineKey.getState(state)).toEqual(new Set(["h"]));
    const next = state.apply(state.tr.setMeta(outlineKey, new Set()));
    expect(outlineKey.getState(next)).toEqual(new Set());
    expect(plugin.props.decorations?.call(plugin, next)).toBeDefined();
  });
});

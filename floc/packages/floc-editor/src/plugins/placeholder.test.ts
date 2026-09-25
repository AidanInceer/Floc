import { describe, expect, it } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import type { DecorationSet } from "@tiptap/pm/view";

import { BLANK_PAGE, placeholders } from "./placeholder";
import { caretIn, line, page } from "../commands/testing";

const hint = (state: EditorState, focused = true) => {
  const plugin = placeholders(() => focused);
  const set = plugin.props.decorations?.call(plugin, EditorState.create({ doc: state.doc, selection: state.selection, plugins: [plugin] })) as DecorationSet | null;
  return set?.find().map((deco) => (deco as unknown as { type: { attrs: Record<string, string> } }).type.attrs["data-placeholder"]) ?? [];
};

describe("placeholders", () => {
  it("tells a blank page how to start, focused or not", () => {
    expect(hint(caretIn(page(line("paragraph")), 0), false)).toEqual([BLANK_PAGE]);
  });

  it("names the empty line under the caret, and only while focused", () => {
    const state = caretIn(page(line("paragraph", "x"), line("check")), 1);
    expect(hint(state)).toEqual(["To do"]);
    expect(hint(state, false)).toEqual([]);
  });

  it("says nothing on a line with words, or on an empty line the caret is not in", () => {
    expect(hint(caretIn(page(line("paragraph", "x"), line("paragraph")), 0, 1))).toEqual([]);
  });
});

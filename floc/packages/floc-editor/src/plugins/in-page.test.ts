// @vitest-environment happy-dom
/**
 * The page in a real editor (#408): the keys that mark words, a tick and a
 * fold pressed on the page, and a typed shortcut. Runs the whole kit — live
 * doc included — the way the web and the phone mount it.
 */
import { Editor } from "@tiptap/core";
import * as Y from "yjs";
import { describe, expect, it, vi } from "vitest";
import { seedPageYjs } from "@floc/core/notes/pages/page-yjs";

import { pageKit } from "../view/page-kit";
import { LinkNames } from "../view/trip-link-view";

function mount(onFold = vi.fn()) {
  const doc = new Y.Doc();
  seedPageYjs(doc, [
    { type: "heading", id: "h", level: 2, indent: 0, content: [{ type: "text", text: "To book" }] },
    { type: "check", indent: 0, checked: false, content: [{ type: "text", text: "Flights" }] },
    { type: "paragraph", indent: 0, content: [{ type: "text", text: "Lisbon" }] },
    { type: "paragraph", indent: 0, content: [] },
  ]);
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: pageKit({
      doc,
      awareness: null,
      user: { id: "u", name: "Ada", tone: "who-1", color: "#000000" },
      names: new LinkNames(),
      folded: new Set(),
      onFold,
      onFull: () => {},
      onOpenLink: () => {},
    }),
  });
  return { editor, doc, onFold };
}

const press = (el: Element) => el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

describe("the page in an editor", () => {
  it("bolds, italicises, underlines and strikes the selection from the keyboard", () => {
    const { editor } = mount();
    const at = editor.state.doc.child(0).nodeSize + editor.state.doc.child(1).nodeSize + 1;
    editor.commands.setTextSelection({ from: at, to: at + 6 });
    for (const key of ["Mod-b", "Mod-i", "Mod-u", "Mod-Shift-s"]) editor.commands.keyboardShortcut(key);
    expect(editor.state.doc.child(2).child(0).marks.map((mark) => mark.type.name)).toEqual(["bold", "italic", "underline", "strike"]);
    editor.destroy();
  });

  it("ticks a checklist line and folds a heading when they are pressed", () => {
    const { editor, onFold } = mount();
    const box = editor.view.dom.querySelector("button.box");
    const fold = editor.view.dom.querySelector("button.fold");
    expect(box && fold).toBeTruthy();
    press(box!);
    expect(editor.state.doc.child(1).attrs.checked).toBe(true);
    press(editor.view.dom.querySelector("button.fold")!);
    expect(onFold).toHaveBeenCalledWith(new Set(["h"]));
    expect(editor.view.dom.querySelector("p.check")?.classList.contains("is-hidden")).toBe(true);
    press(editor.view.dom.querySelector("button.fold")!);
    expect(onFold).toHaveBeenLastCalledWith(new Set());
    editor.destroy();
  });

  it("turns a typed marker into a list line, and Tab indents it", () => {
    const { editor } = mount();
    editor.commands.focus("end");
    const view = editor.view;
    for (const char of ["-", " "]) {
      const { from, to } = view.state.selection;
      const handled = view.someProp("handleTextInput", (f) => f(view, from, to, char, () => view.state.tr.insertText(char, from, to)));
      if (!handled) view.dispatch(view.state.tr.insertText(char, from, to));
    }
    expect(editor.state.doc.lastChild?.type.name).toBe("bullet");
    editor.commands.keyboardShortcut("Tab");
    expect(editor.state.doc.lastChild?.attrs.indent).toBe(1);
    editor.destroy();
  });
});

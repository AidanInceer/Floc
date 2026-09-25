import { describe, expect, it } from "vitest";
import { TextSelection } from "@tiptap/pm/state";

import { addComment, commentAnchors, removeComment, setHighlight, setLink, toggleCheck } from "./marks";
import { caretIn, line, page, run, schema } from "./testing";

const selecting = (from: number, to: number) => {
  const doc = page(line("paragraph", "Maybe hire a car"), line("paragraph", "Trains instead"));
  const state = caretIn(doc, 0);
  return state.apply(state.tr.setSelection(TextSelection.create(doc, from, to)));
};

describe("comments", () => {
  it("pins a comment to the selected words", () => {
    const next = run(addComment(7), selecting(7, 17)).state;
    expect(commentAnchors(next.doc)).toEqual(new Map([[7, 7]]));
    expect(run(addComment(8), selecting(3, 3)).ok).toBe(false);
  });

  it("lets two comments share words, and removes one by its thread", () => {
    let state = run(addComment(1), selecting(7, 17)).state;
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 13, 17)));
    state = run(addComment(2), state).state;
    expect([...commentAnchors(state.doc).keys()]).toEqual([1, 2]);
    state = run(removeComment(1), state).state;
    expect([...commentAnchors(state.doc).keys()]).toEqual([2]);
    expect(run(removeComment(99), state).ok).toBe(false);
  });
});

describe("links and highlights", () => {
  it("links the selection, adding https when left out", () => {
    const next = run(setLink("cp.pt"), selecting(1, 6)).state;
    expect(next.doc.child(0).child(0).marks[0].attrs).toEqual({ href: "https://cp.pt" });
    const kept = run(setLink("mailto:a@b.c"), selecting(1, 6)).state;
    expect(kept.doc.child(0).child(0).marks[0].attrs).toEqual({ href: "mailto:a@b.c" });
  });

  it("refuses a link that could run script", () => {
    expect(run(setLink("javascript:alert(1)"), selecting(1, 6)).ok).toBe(false);
  });

  it("highlights in a tone, and one tone replaces another", () => {
    let state = run(setHighlight("butter"), selecting(1, 6)).state;
    state = run(setHighlight("mint"), state).state;
    expect(state.doc.child(0).child(0).marks.map((mark) => mark.attrs.tone)).toEqual(["mint"]);
  });
});

describe("toggleCheck", () => {
  it("ticks and unticks a checklist line, and nothing else", () => {
    const state = caretIn(page(line("check", "Flights"), line("paragraph", "x")), 0);
    const ticked = run(toggleCheck(0), state).state;
    expect(ticked.doc.child(0).attrs.checked).toBe(true);
    expect(run(toggleCheck(0), ticked).state.doc.child(0).attrs.checked).toBe(false);
    expect(run(toggleCheck(9), state).ok).toBe(false);
    expect(schema.nodes.check).toBeDefined();
  });
});

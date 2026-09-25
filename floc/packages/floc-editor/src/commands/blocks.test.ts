import { describe, expect, it } from "vitest";

import { applyShortcut, findTrigger, insertAtTrigger, turnInto, type Trigger } from "./blocks";
import { caretBlock, caretIn, line, lines, page, run, schema } from "./testing";

describe("applyShortcut", () => {
  it("turns a typed marker at the start of a text line into its block", () => {
    const cases: [string, string][] = [
      ["# ", "heading"], ["## ", "heading"], ["### ", "heading"], ["- ", "bullet"], ["* ", "bullet"],
      ["1. ", "numbered"], ["12) ", "numbered"], ["[] ", "check"], ["[ ] ", "check"], ["> ", "quote"],
    ];
    for (const [marker, type] of cases) {
      const state = caretIn(page(line("paragraph", marker)), 0, marker.length);
      const next = run(applyShortcut, state).state;
      expect(lines(next)).toEqual([`${type}:0:`]);
    }
    const heading = run(applyShortcut, caretIn(page(line("paragraph", "## ")), 0, 3)).state;
    expect(heading.doc.child(0).attrs.level).toBe(2);
  });

  it("keeps the indent, and makes a divider from three dashes", () => {
    expect(lines(run(applyShortcut, caretIn(page(line("paragraph", "- ", { indent: 2 })), 0, 2)).state)).toEqual(["bullet:2:"]);
    const next = run(applyShortcut, caretIn(page(line("paragraph", "---")), 0, 3)).state;
    expect(lines(next)).toEqual(["divider:-:", "paragraph:0:"]);
    expect(caretBlock(next)).toBe(1);
  });

  it("does nothing mid-line, in a list line, or on ordinary text", () => {
    expect(run(applyShortcut, caretIn(page(line("paragraph", "a - ")), 0, 4)).ok).toBe(false);
    expect(run(applyShortcut, caretIn(page(line("bullet", "- ")), 0, 2)).ok).toBe(false);
    expect(run(applyShortcut, caretIn(page(line("paragraph", "Lisbon ")), 0, 7)).ok).toBe(false);
  });
});

describe("findTrigger", () => {
  it("opens the block menu on a slash at the start or after a space", () => {
    expect(findTrigger(caretIn(page(line("paragraph", "/")), 0, 1))).toEqual({ kind: "blocks", from: 1, to: 2, query: "" });
    expect(findTrigger(caretIn(page(line("paragraph", "go /tab")), 0, 7))).toEqual({ kind: "blocks", from: 4, to: 8, query: "tab" });
    expect(findTrigger(caretIn(page(line("paragraph", "a/b")), 0, 3))).toBeNull();
  });

  it("opens emoji on a colon once a letter follows", () => {
    expect(findTrigger(caretIn(page(line("paragraph", "sun :")), 0, 5))).toBeNull();
    expect(findTrigger(caretIn(page(line("paragraph", "sun :be")), 0, 7))).toEqual({ kind: "emoji", from: 5, to: 8, query: "be" });
    expect(findTrigger(caretIn(page(line("paragraph", "at 10:30")), 0, 8))).toBeNull();
  });

  it("closes on a double space, and never in a table", () => {
    expect(findTrigger(caretIn(page(line("paragraph", "/a  ")), 0, 4))).toBeNull();
  });
});

describe("turnInto", () => {
  const at = (trigger: Trigger) => trigger;

  it("changes an empty line in place, and removes what was typed to ask", () => {
    const state = caretIn(page(line("paragraph", "/he", { indent: 1 })), 0, 3);
    const next = run(turnInto("heading", { level: 1 }, at({ kind: "blocks", from: 1, to: 4, query: "he" })), state).state;
    expect(lines(next)).toEqual(["heading:1:"]);
    expect(next.doc.child(0).attrs.level).toBe(1);
  });

  it("adds the block after a line that has words, and moves there", () => {
    const state = caretIn(page(line("paragraph", "Ideas /")), 0, 7);
    const next = run(turnInto("check", {}, at({ kind: "blocks", from: 7, to: 8, query: "" })), state).state;
    expect(lines(next)).toEqual(["paragraph:0:Ideas ", "check:0:"]);
    expect(caretBlock(next)).toBe(1);
  });

  it("puts a divider or a table in, with a line to carry on after", () => {
    const divider = run(turnInto("divider", {}, at({ kind: "blocks", from: 1, to: 2, query: "" })), caretIn(page(line("paragraph", "/")), 0, 1)).state;
    expect(lines(divider)).toEqual(["divider:-:", "paragraph:0:"]);
    const made = run(turnInto("table", {}, at({ kind: "blocks", from: 1, to: 2, query: "" })), caretIn(page(line("paragraph", "/")), 0, 1)).state;
    expect(lines(made)[0]).toBe("table:-:");
    expect(made.doc.child(0).childCount).toBe(3);
    expect(made.doc.child(0).child(0).childCount).toBe(3);
    expect(made.selection.$from.parent.type.name).toBe("tableCell");
  });
});

describe("insertAtTrigger", () => {
  it("puts an emoji where the colon was", () => {
    const state = caretIn(page(line("paragraph", "beach :be")), 0, 9);
    const next = run(insertAtTrigger(schema.text("🏖️"), { kind: "emoji", from: 7, to: 10, query: "be" }), state).state;
    expect(next.doc.textContent).toBe("beach 🏖️");
  });

  it("puts a trip link and a space where the slash was", () => {
    const state = caretIn(page(line("paragraph", "Book /")), 0, 6);
    const link = schema.nodes.tripLink.create({ kind: "event", id: 3, label: "Dinner in Alfama" });
    const next = run(insertAtTrigger(link, { kind: "blocks", from: 6, to: 7, query: "" }, true), state).state;
    expect(next.doc.child(0).child(1).type.name).toBe("tripLink");
    expect(next.doc.child(0).child(1).attrs.label).toBe("Dinner in Alfama");
    expect(next.doc.child(0).lastChild?.text).toBe(" ");
  });
});

/**
 * Every node and mark out to HTML and back (#408): what copy and paste within
 * a page, and the web view's first paint, rely on.
 */
import { Window } from "happy-dom";
import { DOMParser as PMDOMParser, DOMSerializer } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";

import { schema } from "../commands/testing";

const window = new Window();
const document = window.document as unknown as Document;

const doc = schema.node("doc", null, [
  schema.node("paragraph", { indent: 1 }, [
    schema.text("bold", [schema.mark("bold")]),
    schema.text("it", [schema.mark("italic")]),
    schema.text("un", [schema.mark("underline")]),
    schema.text("st", [schema.mark("strike")]),
    schema.text("ln", [schema.mark("link", { href: "https://cp.pt" })]),
    schema.text("hl", [schema.mark("highlight", { tone: "mint" })]),
    schema.node("hardBreak"),
    schema.node("tripLink", { kind: "event", id: 3, label: "Tram 28" }),
  ]),
  schema.node("heading", { level: 2, id: "h", indent: 0 }, [schema.text("Ideas")]),
  schema.node("bullet", { indent: 2 }, [schema.text("b")]),
  schema.node("numbered", {}, [schema.text("n")]),
  schema.node("check", { checked: true }, [schema.text("c")]),
  schema.node("quote", {}, [schema.text("q")]),
  schema.node("divider"),
  schema.node("table", { header: true }, [
    schema.node("tableRow", null, [schema.node("tableCell", { tone: "butter" }, [schema.text("x")]), schema.node("tableCell")]),
  ]),
]);

function roundTrip(node: typeof doc) {
  const box = document.createElement("div");
  box.append(DOMSerializer.fromSchema(schema).serializeFragment(node.content, { document }) as unknown as globalThis.Node);
  return { html: box.innerHTML, back: PMDOMParser.fromSchema(schema).parse(box as unknown as HTMLElement) };
}

describe("a page as HTML", () => {
  it("comes back as the same page, but for heading ids and comments, which stay behind", () => {
    const { back } = roundTrip(doc);
    const lines: string[] = [];
    back.forEach((node) => lines.push(`${node.type.name}:${JSON.stringify(node.attrs)}`));
    expect(lines).toEqual([
      'paragraph:{"indent":1}',
      'heading:{"indent":0,"level":2,"id":""}',
      'bullet:{"indent":2}',
      'numbered:{"indent":0}',
      'check:{"indent":0,"checked":true}',
      'quote:{"indent":0}',
      "divider:{}",
      'table:{"header":true}',
    ]);
    const marks = back.child(0).content.content.flatMap((node) => node.marks.map((mark) => mark.type.name));
    expect(marks).toEqual(["bold", "italic", "underline", "strike", "link", "highlight"]);
    expect(back.child(0).child(7).attrs).toEqual({ kind: "event", id: 3, label: "Tram 28" });
    expect(back.child(7).child(0).child(0).attrs.tone).toBe("butter");
  });

  it("draws comments as dotted words, and never takes one from pasted HTML", () => {
    const commented = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("car", [schema.mark("comment", { id: 4 })])])]);
    const { html, back } = roundTrip(commented);
    expect(html).toContain('data-comment="4"');
    expect(back.child(0).child(0).marks).toEqual([]);
  });

  it("reads Google's not-bold wrapper as plain, a weight as bold, and an unknown tone or kind as none", () => {
    const box = document.createElement("div");
    box.innerHTML = '<p><b style="font-weight:normal">plain</b><span style="font-weight:700">heavy</span><mark data-tone="neon">x</mark><span data-trip-link data-kind="planet" data-id="2">Mars</span></p><h5>small</h5><table><tr><th>h</th></tr></table>';
    const back = PMDOMParser.fromSchema(schema).parse(box as unknown as HTMLElement);
    const [plain, heavy, x] = back.child(0).content.content;
    expect([plain.marks.length, heavy.marks.map((m) => m.type.name), x.marks.length]).toEqual([0, ["bold"], 0]);
    expect(back.child(0).child(3).attrs.kind).toBe("day");
    expect(back.child(1).attrs.level).toBe(3);
    expect(back.child(2).attrs.header).toBe(true);
  });
});

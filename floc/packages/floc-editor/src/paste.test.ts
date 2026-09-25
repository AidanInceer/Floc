import { Window } from "happy-dom";
import { DOMParser as PMDOMParser } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";

import { reshapePastedHtml } from "./paste";
import { schema } from "./commands/testing";

const window = new Window();
const parse = (html: string) => new window.DOMParser().parseFromString(html, "text/html") as unknown as Document;

/** What the page would hold after the paste: `type:indent:text`, as the schema reads the reshaped HTML. */
function pasted(html: string) {
  const reshaped = parse(reshapePastedHtml(html, parse));
  const doc = PMDOMParser.fromSchema(schema).parse(reshaped.body as unknown as HTMLElement);
  const out: string[] = [];
  doc.forEach((node) => out.push(`${node.type.name}:${(node.attrs.indent as number | undefined) ?? "-"}:${node.textContent}`));
  return { out, doc };
}

// Google Docs' own shape: a wrapping <b style="font-weight:normal">, spans with inline styles, lists of <li><p>.
const GOOGLE_DOCS = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1">
<h2 dir="ltr"><span style="font-size:16pt;font-family:Arial;color:#434343">Lisbon</span></h2>
<p dir="ltr"><span style="font-family:Arial;color:#ff0000">Go </span><span style="font-weight:700">early</span><span style="font-style:italic"> please</span></p>
<ul><li dir="ltr"><p dir="ltr"><span>Tram 28</span></p><ul><li><p><span>Martim Moniz</span></p></li></ul></li></ul>
<ol><li><p><span>Card</span></p></li></ol>
<ul><li role="checkbox" aria-checked="true"><p><span>Flights</span></p></li></ul>
<p><a href="https://cp.pt"><span style="text-decoration:underline">trains</span></a><img src="x.png"></p>
<table><tbody><tr><td><p><span>Place</span></p><p><span>two</span></p></td><td><p>Booked</p></td></tr></tbody></table>
</b>`;

describe("reshapePastedHtml", () => {
  it("keeps headings, lists with their depth, checklists, links and tables from Google Docs", () => {
    const { out } = pasted(GOOGLE_DOCS);
    expect(out).toEqual([
      "heading:0:Lisbon",
      "paragraph:0:Go early please",
      "bullet:0:Tram 28",
      "bullet:1:Martim Moniz",
      "numbered:0:Card",
      "check:0:Flights",
      "paragraph:0:trains",
      "table:-:Placetwo" + "Booked",
    ]);
  });

  it("keeps bold and italic, drops the wrapper's not-bold, fonts and colours", () => {
    const { doc } = pasted(GOOGLE_DOCS);
    const line = doc.child(1);
    expect(line.child(0).marks).toEqual([]);
    expect(line.child(1).marks.map((mark) => mark.type.name)).toEqual(["bold"]);
    expect(line.child(2).marks.map((mark) => mark.type.name)).toEqual(["italic"]);
    expect(doc.child(5).attrs.checked).toBe(true);
    expect(doc.child(6).child(0).marks.map((mark) => [mark.type.name, mark.attrs.href as string | undefined])).toEqual([["underline", undefined], ["link", "https://cp.pt"]]);
  });

  it("keeps a plain checkbox list, and caps the depth at three", () => {
    const deep = "<ul><li><input type=checkbox checked>a<ul><li>b<ul><li>c<ul><li>d<ul><li>e</li></ul></li></ul></li></ul></li></ul></li></ul>";
    expect(pasted(deep).out).toEqual(["check:0:a", "bullet:1:b", "bullet:2:c", "bullet:3:d", "bullet:3:e"]);
    expect(pasted(deep).doc.child(0).attrs.checked).toBe(true);
  });
});

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { gooLayer } from "./goo-layer";

const rects = () => [...document.querySelectorAll(".trip-open-goo rect")];
const attr = (el: Element, k: string) => Number(el.getAttribute(k));

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("style");
});

describe("gooLayer", () => {
  it("lays one hidden filter layer over the window", () => {
    gooLayer();
    const svg = document.querySelector(".trip-open-goo")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelector("filter#trip-open-goo")).not.toBeNull();
  });

  it("draws the card alone once the neck lets go", () => {
    gooLayer().draw({ neck: null, card: { x: 0, y: 0, w: 200, h: 100 } });
    expect(rects()).toHaveLength(1);
  });

  it("draws the neck beside the card while it holds", () => {
    const layer = gooLayer();
    layer.draw({ neck: { x: 0, y: 0, w: 20, h: 40 }, card: { x: 0, y: 40, w: 200, h: 100 } });
    layer.draw({ neck: { x: 0, y: 0, w: 20, h: 60 }, card: { x: 0, y: 60, w: 200, h: 100 } });
    expect(rects()).toHaveLength(2);
  });

  it("never draws a negative size or a corner wider than the shape", () => {
    document.documentElement.style.setProperty("--radius-md", "12px");
    gooLayer().draw({ neck: null, card: { x: 0, y: 0, w: -4, h: 10 } });
    const [card] = rects();
    expect(attr(card!, "width")).toBe(0);
    expect(attr(card!, "rx")).toBe(0);
  });

  it("takes itself away", () => {
    gooLayer().remove();
    expect(document.querySelector(".trip-open-goo")).toBeNull();
  });
});

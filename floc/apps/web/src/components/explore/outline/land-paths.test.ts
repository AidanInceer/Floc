import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandPaths } from "./land-paths";

const home = "M0 0L10 0L10 10Z";
const other = "M10 0L20 0L20 10Z";
const islet = { x: 30, y: 30, r: 4 };

type Shape = { tag: string; attrs: Record<string, string> };

function shapes(): Shape[] {
  const html = renderToStaticMarkup(createElement(LandPaths, { home, other, islets: [islet], fill: "fill-[var(--tone-blue)]" }));
  return [...html.matchAll(/<(path|circle|g)\b([^>]*)>/g)].map(([, tag, body]) => ({
    tag: tag!,
    attrs: Object.fromEntries([...body!.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k!, v!])),
  }));
}

const isLine = (s: Shape) => "stroke-width" in s.attrs;
const lines = () => shapes().filter(isLine);

describe("the land on an Explore outline", () => {
  it("draws the trip's country's edge the same on the coast as on a land border", () => {
    expect(new Set(lines().map((l) => l.attrs["stroke-width"]))).toEqual(new Set(["0.75"]));
    expect(new Set(lines().map((l) => l.attrs.class))).toEqual(new Set(["stroke-rule-strong"]));
    const drawn = lines().map((l) => l.attrs.d ?? "").join("");
    expect(drawn).toContain(home);
    expect(drawn).toContain(other);
  });

  it("lays every edge over all the land, so no fill covers half of a border", () => {
    const all = shapes().filter((s) => s.tag !== "g");
    const firstLine = all.findIndex(isLine);
    expect(firstLine).toBeGreaterThan(0);
    expect(all.slice(firstLine).every(isLine)).toBe(true);
    expect(all.slice(0, firstLine).some((s) => /stroke/.test(s.attrs.class ?? ""))).toBe(false);
  });

  it("outlines a patch of land under a stop in the sea as it outlines the coast", () => {
    expect(lines().filter((l) => l.tag === "circle")).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";

import { darkTokens, lightTokens, resolveColours, resolveTokens } from "./tokens";

describe("resolveTokens", () => {
  it("follows an alias to the value it points at", () => {
    // --red is `var(--pastel-red-ink)` and has no dark counterpart of its own.
    expect(resolveTokens("light").red).toBe(lightTokens["pastel-red-ink"]);
    expect(resolveTokens("dark").red).toBe(darkTokens["pastel-red-ink"]);
  });

  it("overlays dark on light rather than replacing it", () => {
    const dark = resolveTokens("dark");
    // Restated in dark…
    expect(dark.paper).toBe(darkTokens.paper);
    // …and inherited from light, because dark says nothing about it.
    expect(dark.ease).toBe(lightTokens.ease);
  });

  it("keeps a composite value whole", () => {
    expect(resolveTokens("light")["shadow-sm"]).toContain("rgb(");
  });
});

describe("resolveColours", () => {
  it("keeps only the plain hexes a native style can use", () => {
    const colours = resolveColours("light");
    expect(colours.pen).toBe("#4e68d8");
    // Composites and font stacks are not colours.
    expect(colours.shadow).toBeUndefined();
    expect(colours.sans).toBeUndefined();
    // …nor is a non-hex colour function.
    expect(colours.vignette).toBeUndefined();
  });

  it("resolves every seat colour in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const colours = resolveColours(theme);
      for (let seat = 1; seat <= 8; seat += 1) {
        expect(colours[`who-${seat}`]).toMatch(/^#[0-9a-f]{6}$/);
        expect(colours[`who-${seat}-ink`]).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});

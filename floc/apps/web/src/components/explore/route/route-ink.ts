import type { TransportType } from "@floc/core/vocabulary";

/** The tokens and faces a route is drawn in, read from the page so a canvas follows the theme. */
export type RouteInk = { ink: string; ink2: string; sheet: string; rule: string; sans: string; display: string; type: string };

export function readInk(el: Element): RouteInk {
  const css = getComputedStyle(el);
  const read = (name: string) => css.getPropertyValue(`--${name}`).trim().replace(/\s+/g, " ");
  return { ink: read("ink"), ink2: read("ink-2"), sheet: read("sheet"), rule: read("rule-2"), sans: read("sans"), display: read("display"), type: read("type") };
}

/** How each way to travel is drawn, for a line `w` px wide: a solid road, dotted rail, long dashes to fly, short ones to sail. */
export function lineFor(mode: TransportType | null, w: number): { width: number; dash: number[]; cap: "round" | "butt" } {
  if (mode === "train") return { width: w * 1.3, dash: [0.01, w * 2.1], cap: "round" };
  if (mode === "flight") return { width: w * 0.85, dash: [w * 3.4, w * 2.6], cap: "round" };
  if (mode === "ferry") return { width: w * 0.85, dash: [w * 1.5, w * 1.9], cap: "butt" };
  return { width: w, dash: [], cap: "round" };
}

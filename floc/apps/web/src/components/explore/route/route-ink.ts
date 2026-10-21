import type { TransportType } from "@floc/core/vocabulary";

/** The tokens and faces a route is drawn in, read from the page so a canvas follows the theme. */
export type RouteInk = { ink: string; ink2: string; sheet: string; rule: string; sans: string; display: string; type: string };

export function readInk(el: Element): RouteInk {
  const css = getComputedStyle(el);
  const read = (name: string) => css.getPropertyValue(`--${name}`).trim().replace(/\s+/g, " ");
  return { ink: read("ink"), ink2: read("ink-2"), sheet: read("sheet"), rule: read("rule-2"), sans: read("sans"), display: read("display"), type: read("type") };
}

/** How each way to travel is drawn, for a line `w` px wide: a solid road, dotted rail, long dashes to fly, short ones to sail, a thin broken line when nobody has said. */
export function lineFor(mode: TransportType | null, w: number): { width: number; dash: number[]; cap: "round" | "butt" } {
  if (mode === "train") return { width: w * 1.3, dash: [0.01, w * 2.1], cap: "round" };
  if (mode === "flight") return { width: w * 0.85, dash: [w * 3.4, w * 2.6], cap: "round" };
  if (mode === "ferry") return { width: w * 0.85, dash: [w * 1.5, w * 1.9], cap: "butt" };
  if (!mode) return { width: w * 0.75, dash: [w * 1.1, w * 2.2], cap: "round" };
  return { width: w, dash: [], cap: "round" };
}

type Dot = { r: number; ring: number };
export type RouteSize = { line: number; edge: number; mid: Dot; end: Dot };

/** Every size a route is drawn at: `map` on a canvas (the globes, the pass), `tile` in the SVG outline. Side by side so a change to one is weighed against the other. */
export const ROUTE_SIZE: Record<"map" | "tile", RouteSize> = {
  map: { line: 1.9, edge: 7, mid: { r: 4.4, ring: 1.8 }, end: { r: 6.5, ring: 2 } },
  tile: { line: 1.5, edge: 5, mid: { r: 3, ring: 1.3 }, end: { r: 4.6, ring: 1.5 } },
};

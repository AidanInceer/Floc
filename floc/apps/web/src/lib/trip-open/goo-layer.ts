/**
 * The liquid layer the curtain is drawn on, under the top bar and the page: shapes blurred together and cut sharp
 * again with a hairline in the bar's own --rule, so the neck reads as part of the joined bar (fuse-bar.css).
 */
import type { Box } from "./curtain";

const NS = "http://www.w3.org/2000/svg";

export type GooShapes = { neck: Box | null; card: Box };

export function gooLayer() {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string) => css.getPropertyValue(name).trim();
  const [radiusSm, radiusMd] = [parseFloat(read("--radius-sm")) || 0, parseFloat(read("--radius-md")) || 0];
  const [w, h] = [innerWidth, innerHeight];
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "trip-open-goo");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.innerHTML =
    `<defs><filter id="trip-open-goo" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/>` +
    `<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" result="g"/>` +
    `<feMorphology in="g" operator="dilate" radius="1" result="d"/>` +
    `<feFlood flood-color="${read("--rule")}" result="c"/><feComposite in="c" in2="d" operator="in" result="edge"/>` +
    `<feMerge><feMergeNode in="edge"/><feMergeNode in="g"/></feMerge></filter></defs>` +
    `<g filter="url(#trip-open-goo)" fill="${read("--sheet")}"></g>`;
  document.body.appendChild(svg);
  const group = svg.querySelector("g")!;

  const rect = (b: Box, rx: number) => {
    const el = document.createElementNS(NS, "rect");
    const r = Math.max(0, Math.min(rx, b.w / 2, b.h / 2));
    for (const [k, v] of Object.entries({ x: b.x, y: b.y, width: Math.max(0, b.w), height: Math.max(0, b.h), rx: r })) el.setAttribute(k, String(v));
    return el;
  };

  return {
    // Why: no shape for the bar itself; the neck starts inside it, under the bar's own skin, so only one outline shows.
    draw({ neck, card }: GooShapes) {
      const shapes = [rect(card, radiusMd)];
      if (neck) shapes.push(rect(neck, radiusSm));
      group.replaceChildren(...shapes);
    },
    remove() {
      svg.remove();
    },
  };
}
